
import { supabase } from '@/integrations/supabase/client';
import { processDocumentInBrowser } from './browserDocumentProcessor';

/**
 * Processes a document using the browser-based processor instead of the edge function
 * @param fileId The ID of the file to process
 * @returns Promise that resolves when processing is complete
 */
export async function processDocument(fileId: string): Promise<{ success: boolean, error?: string }> {
  try {
    console.log("Processing document with fileId:", fileId);
    
    // Get the file data from the database
    const { data: fileData, error: fileError } = await supabase
      .from('cv_files')
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (fileError) {
      console.error('Error fetching file data:', fileError);
      return { success: false, error: fileError.message };
    }
    
    // Check if we have access to the file in the browser
    if (!fileData.storage_path) {
      return { 
        success: false, 
        error: 'No storage path available for the file. Cannot process in browser.' 
      };
    }
    
    // Download the file from storage
    const { data: fileBuffer, error: downloadError } = await supabase
      .storage
      .from('lens')
      .download(fileData.storage_path);
    
    if (downloadError) {
      console.error('Error downloading file:', downloadError);
      return { success: false, error: downloadError.message };
    }
    
    // Create a File object that can be processed by the browser processor
    const file = new File([fileBuffer], fileData.name, { type: fileData.type });
    
    // Process the file using the browser-based processor
    return processDocumentInBrowser(fileId, file);
    
  } catch (error: any) {
    console.error("Error in processDocument:", error);
    return { success: false, error: error.message || 'An unknown error occurred' };
  }
}

/**
 * Updates the file status in the database
 */
export function updateFileStatus(fileId: string, status: 'processing' | 'completed' | 'failed', progress?: number, error?: string) {
  return supabase
    .from('cv_files')
    .update({
      status,
      progress,
      error
    })
    .eq('id', fileId);
}
