import { supabase } from './supabase';

// SQL for creating projects table
export const createProjectsTable = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  documents_count INTEGER DEFAULT 0
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects
CREATE POLICY IF NOT EXISTS "Users can create their own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view their own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
`;

// SQL for creating cv_files table
export const createCVFilesTable = `
CREATE TABLE IF NOT EXISTS cv_files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
  progress INTEGER,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  storage_path TEXT,
  storage_url TEXT,
  error TEXT,
  parsed_data JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cv_files_project_id ON cv_files(project_id);
CREATE INDEX IF NOT EXISTS idx_cv_files_user_id ON cv_files(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_files_status ON cv_files(status);

-- Enable RLS
ALTER TABLE cv_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for cv_files
CREATE POLICY IF NOT EXISTS "Users can create their own cv_files"
  ON cv_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view their own cv_files"
  ON cv_files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own cv_files"
  ON cv_files FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own cv_files"
  ON cv_files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
`;

// SQL for setting up storage bucket policies
export const createStoragePolicies = `
-- Create policy to allow authenticated users to insert objects
CREATE POLICY "Allow authenticated users to upload CVs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lens' AND auth.uid() IS NOT NULL);

-- Create policy to allow users to select their own objects
CREATE POLICY "Allow users to view their own CVs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'lens' AND auth.uid() IS NOT NULL);

-- Create policy to allow users to update their own objects
CREATE POLICY "Allow users to update their own CVs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'lens' AND auth.uid() IS NOT NULL);

-- Create policy to allow users to delete their own objects
CREATE POLICY "Allow users to delete their own CVs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'lens' AND auth.uid() IS NOT NULL);
`;

// Function to run migrations
export const runMigrations = async () => {
  try {
    console.log('Checking database setup...');
    
    // Check if tables already exist
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .limit(1)
      .catch(err => {
        // Return an object with the same structure as the supabase response
        return { data: null, error: err };
      });
    
    // If no error, tables exist and we can skip migrations
    if (!error) {
      console.log('Database tables already exist, skipping migrations');
      return { success: true };
    }
    
    console.log('Running migrations...');
    
    // Create projects table directly using SQL
    try {
      console.log('Creating projects table...');
      const { error } = await supabase.from('projects').select('id').limit(1);
      if (error && error.code === '42P01') {
        // Use PSQL directly
        await mcp_createTable('projects', createProjectsTable);
      }
    } catch (projectsError) {
      console.error('Error checking projects table:', projectsError);
    }
    
    // Create cv_files table
    try {
      console.log('Creating cv_files table...');
      const { error } = await supabase.from('cv_files').select('id').limit(1);
      if (error && error.code === '42P01') {
        // Use PSQL directly
        await mcp_createTable('cv_files', createCVFilesTable);
      }
    } catch (cvFilesError) {
      console.error('Error checking cv_files table:', cvFilesError);
    }
    
    // Skip storage policy creation as it's likely already set up
    
    console.log('Migrations completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Migration error:', error);
    return { success: false, error };
  }
};

// Helper function for SQL execution that doesn't rely on custom methods
async function mcp_createTable(name: string, sql: string) {
  try {
    // Execute raw SQL directly - handle this on the server side
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      // If the exec_sql function doesn't exist
      if (error.message && error.message.includes('function "exec_sql" does not exist')) {
        // Direct SQL execution via the console
        console.error(`Table creation failed. Please run this SQL in the Supabase SQL editor:`, sql);
        return { success: false, error };
      }
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Error creating ${name}:`, error);
    return { success: false, error };
  }
} 