import { createClient } from '@supabase/supabase-js';

// Use the actual Supabase URL and anon key
const supabaseUrl = 'https://pbefndabvlaebfexhhnv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZWZuZGFidmxhZWJmZXhoaG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NTk3OTYsImV4cCI6MjA2MjMzNTc5Nn0.6yRR2fLreSCFmSb1XlIMe4X98P58TWHYM_4t1tx1xz8';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Custom query function using rpc
export async function executeSQL(sql: string, params?: any[]) {
  const rpcOptions = { count: 'exact' as const };
  
  // Apply SQL using PostgreSQL functions
  const { data, error, count } = await supabase.rpc(
    'pgfunction', 
    { sql, params: params || [] },
    rpcOptions
  );
  
  return { data, error, count };
}

// Match a candidate against project requirements
export interface MatchCandidateParams {
  candidate_id: string;
  project_id: string;
  filter_group_id?: string;
}

export interface MatchCandidateResult {
  id: string;
  cv_file_id: string;
  project_id: string;
  filter_group_id: string | null;
  rating: 'A' | 'B' | 'C' | 'D';
  rating_reason: string;
  created_at: string;
  updated_at: string;
}

export async function matchCandidate(params: MatchCandidateParams): Promise<MatchCandidateResult | null> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/match_candidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error matching candidate:', errorData);
      throw new Error(errorData.error || 'Failed to match candidate');
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to match candidate');
    }

    return result.data;
  } catch (error) {
    console.error('Error in matchCandidate:', error);
    return null;
  }
}

// The name of the storage bucket
export const STORAGE_BUCKET = 'lens';

// Storage helpers
export const getStoragePath = (fileId: string, fileName: string) => {
  // Encode the filename to handle special characters
  const encodedFileName = encodeURIComponent(fileName);
  return `${fileId}-${encodedFileName}`;
};

export const getPublicURL = (path: string) => {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}; 
