
// Importing the Supabase client from the official integration file
import { supabase } from '@/integrations/supabase/client';

// Re-export the supabase client for backward compatibility
export { supabase };

// Custom query function
export async function executeSQL(sql: string, params?: any[]) {
  console.log('executeSQL called with:', sql, params);
  // Return empty placeholder response
  return { data: [], error: null, count: 0 };
}

// Storage helpers
export const STORAGE_BUCKET = 'edok';

// Storage helpers
export const getStoragePath = (fileId: string, fileName: string) => {
  // Simplified version that maintains the same interface
  const encodedFileName = encodeURIComponent(fileName);
  return `${fileId}-${encodedFileName}`;
};

export const getPublicURL = (path: string) => {
  // Get public URL from Supabase storage
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
};
