
// Importing the Supabase client from the official integration file
import { supabase } from '@/integrations/supabase/client';

// Re-export the supabase client for backward compatibility
export { supabase };

// Custom query function for any future needs
export async function executeSQL(sql: string, params?: any[]) {
  console.log('executeSQL called with:', sql, params);
  // Return empty placeholder response
  return { data: [], error: null, count: 0 };
}
