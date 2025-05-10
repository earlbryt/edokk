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
 * Extract text from a PDF file
 */
async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map((item: any) => item.str);
      fullText += textItems.join(' ') + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

/**
 * Process a document in the browser
 */
async function processDocument(fileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Update status to processing
    await supabase
      .from('cv_files')
      .update({
        status: 'processing',
        progress: 25
      })
      .eq('id', fileId);

    // Get the file data from the database
    const { data: fileData, error: fileError } = await supabase
      .from('cv_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError) throw fileError;
    if (!fileData) throw new Error('File not found');

    // Download the file from storage
    const { data: fileBuffer, error: downloadError } = await supabase.storage
      .from('lens')
      .download(fileData.storage_path);

    if (downloadError) throw downloadError;

    // Update progress
    await supabase
      .from('cv_files')
      .update({ progress: 50 })
      .eq('id', fileId);

    // Extract text based on file type
    let extractedText = '';
    const arrayBuffer = await fileBuffer.arrayBuffer();

    if (fileData.type === 'application/pdf') {
      extractedText = await extractTextFromPDF(arrayBuffer);
    } else {
      throw new Error('Unsupported file type. Only PDF files are supported.');
    }

    if (!extractedText) {
      throw new Error('No text could be extracted from the document');
    }

    // Basic parsing of the extracted text (you can enhance this)
    const parsed = {
      name: '',
      email: '',
      phone: '',
      skills: [] as string[],
      experience: [] as string[],
      education: [] as string[]
    };

    // Update the database with the extracted text and parsed data
    const { error: updateError } = await supabase
      .from('cv_files')
      .update({
        status: 'completed',
        progress: 100,
        raw_text: extractedText,
        text_extracted: true,
        text_extraction_date: new Date().toISOString(),
        parsed_data: parsed
      })
      .eq('id', fileId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error: any) {
    console.error('Error in processDocument:', error);
    
    // Update the error status in the database
    await supabase
      .from('cv_files')
      .update({
        status: 'failed',
        error: error.message || 'Unknown error processing document'
      })
      .eq('id', fileId);
    
    return { success: false, error: error.message };
  }
} 