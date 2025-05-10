
import { supabase } from '@/integrations/supabase/client';

/**
 * Makes an API call to the document-processor edge function
 * @param fileId The ID of the file to process
 * @returns Promise that resolves when processing is complete
 */
export async function processDocument(fileId: string): Promise<{ success: boolean, error?: string }> {
  try {
    console.log("Calling document-processor with fileId:", fileId);
    // Call the document-processor edge function
    const { data, error } = await supabase.functions.invoke('document-processor', {
      body: { fileId }
    });
    
    if (error) {
      console.error('Error calling document-processor:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, ...data };
  } catch (error: any) {
    console.error("Error in processDocument:", error);
    return { success: false, error: error.message || 'An unknown error occurred' };
  }
}

/**
 * Updates the CVParser component to use the new document processor
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
