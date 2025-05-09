import { createClient } from '@supabase/supabase-js';

// Use the actual Supabase URL and anon key
const supabaseUrl = 'https://pbefndabvlaebfexhhnv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWZuZGFidmxhZWJmZXhoaG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTk3OTYsImV4cCI6MjA2MjMzNTc5Nn0.6yRR2fLreSCFmSb1XlIMe4X98P58TWHYM_4t1tx1xz8';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Storage helpers
export const getStoragePath = (fileId: string, fileName: string) => {
  return `cvs/${fileId}-${fileName}`;
};

export const getPublicURL = (path: string) => {
  const { data } = supabase.storage.from('cvs').getPublicUrl(path);
  return data.publicUrl;
}; 