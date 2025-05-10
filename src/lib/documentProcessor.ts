import { supabase } from '@/integrations/supabase/client';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Queue for processing files
let processingQueue: string[] = [];
let isProcessing = false;

/**
 * Add a file to the processing queue
 */
export function addToProcessingQueue(fileId: string) {
  processingQueue.push(fileId);
  processNextInQueue();
}

/**
 * Process the next file in the queue
 */
async function processNextInQueue() {
  if (isProcessing || processingQueue.length === 0) return;
  
  isProcessing = true;
  const fileId = processingQueue[0];
  
  try {
    await processDocument(fileId);
  } catch (error) {
    console.error(`Error processing file ${fileId}:`, error);
  } finally {
    // Remove the processed file from the queue
    processingQueue = processingQueue.slice(1);
    isProcessing = false;
    
    // Process next file if any
    if (processingQueue.length > 0) {
      processNextInQueue();
    }
  }
}

/**
 * Process a single document
 */
async function processDocument(fileId: string) {
  try {
    // Update status to processing
    await supabase
      .from('cv_files')
      .update({
        status: 'processing',
        progress: 25
      })
      .eq('id', fileId);

    // Get file data from database
    const { data: fileData, error: fileError } = await supabase
      .from('cv_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError) throw fileError;
    if (!fileData) throw new Error('File not found');
    if (!fileData.storage_path) throw new Error('No storage path found for file');

    // Download file from storage
    const { data: fileContent, error: downloadError } = await supabase.storage
      .from('lens')
      .download(fileData.storage_path);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }
    if (!fileContent) throw new Error('File content not found');

    // Convert file to ArrayBuffer
    const arrayBuffer = await fileContent.arrayBuffer();

    // Load PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Extract text from all pages
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    // Update database with extracted text and status
    const { error: updateError } = await supabase
      .from('cv_files')
      .update({
        raw_text: fullText,
        text_extracted: true,
        text_extraction_date: new Date().toISOString(),
        status: 'completed',
        progress: 100
      })
      .eq('id', fileId);

    if (updateError) throw updateError;

    // Call Edge Function to process the text
    const { data: processedData, error: processError } = await supabase.functions
      .invoke('process_resume', {
        body: { resume: { id: fileId, raw_text: fullText } }
      });

    if (processError) {
      console.error('Error processing resume with Edge Function:', processError);
    }

  } catch (error) {
    console.error('Error in processDocument:', error);
    
    // Update database with error status
    await supabase
      .from('cv_files')
      .update({
        text_extracted: false,
        extraction_error: error.message,
        status: 'failed',
        error: error.message
      })
      .eq('id', fileId);

    throw error;
  }
} 