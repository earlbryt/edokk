import { createClient } from '@supabase/supabase-js';

// Use the actual Supabase URL and anon key
const supabaseUrl = 'https://pbefndabvlaebfexhhnv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWZuZGFidmxhZWJmZXhoaG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTk3OTYsImV4cCI6MjA2MjMzNTc5Nn0.6yRR2fLreSCFmSb1XlIMe4X98P58TWHYM_4t1tx1xz8';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add custom query method for SQL execution
supabase.query = async (sql: string, params?: any[]) => {
  const rpcOptions = { count: 'exact' };
  
  // Apply SQL using PostgreSQL functions
  const { data, error, count } = await supabase.rpc(
    'pgfunction', 
    { sql, params: params || [] },
    rpcOptions
  );
  
  return { data, error, count };
};

// The name of the storage bucket
export const STORAGE_BUCKET = 'lens';

// Storage helpers
export const getStoragePath = (fileId: string, fileName: string) => {
  return `${fileId}-${fileName}`;
};

export const getPublicURL = (path: string) => {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}; 