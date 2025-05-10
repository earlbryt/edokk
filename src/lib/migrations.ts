
import { supabase } from '@/integrations/supabase/client';

// Function to create the migrations table if it doesn't exist
async function createMigrationsTable() {
  try {
    console.log("Creating migrations table...");
    
    // Check if migrations table exists by trying to query it
    const { error: checkError } = await supabase
      .from('migrations')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') { // Table doesn't exist error code
      // Create the table with SQL query via RPC
      const { error: createError } = await supabase.rpc('exec_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createError) {
        throw createError;
      }
      console.log("Migrations table created successfully.");
    } else {
      console.log("Migrations table already exists.");
    }
  } catch (error) {
    console.error("Error creating migrations table:", error);
    throw error;
  }
}

// Function to create the projects table if it doesn't exist
async function createProjectsTable() {
  try {
    console.log("Creating projects table...");
    
    // Check if projects table exists
    const { error: checkError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === '42P01') { // Table doesn't exist
      // Create the projects table with SQL query via RPC
      const { error: createError } = await supabase.rpc('exec_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            documents_count INTEGER DEFAULT 0
          );
        `
      });
      
      if (createError) {
        throw createError;
      }
      console.log("Projects table created successfully.");
      
      // Create the cv_files table
      const { error: createFilesError } = await supabase.rpc('exec_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS cv_files (
            id TEXT PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            size TEXT,
            type TEXT,
            status TEXT,
            progress INTEGER,
            storage_path TEXT,
            storage_url TEXT,
            uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            raw_text TEXT,
            text_extracted BOOLEAN DEFAULT FALSE,
            text_extraction_date TIMESTAMP WITH TIME ZONE,
            parsed_data JSONB,
            extraction_error TEXT
          );
        `
      });
      
      if (createFilesError) {
        throw createFilesError;
      }
      console.log("CV Files table created successfully.");

      // Create the filter_groups table
      const { error: createFilterGroupsError } = await supabase.rpc('exec_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS filter_groups (
            id TEXT PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            enabled BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (createFilterGroupsError) {
        throw createFilterGroupsError;
      }
      console.log("Filter Groups table created successfully.");

      // Create the filters table
      const { error: createFiltersError } = await supabase.rpc('exec_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS filters (
            id TEXT PRIMARY KEY,
            filter_group_id TEXT REFERENCES filter_groups(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            value TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (createFiltersError) {
        throw createFiltersError;
      }
      console.log("Filters table created successfully.");
    } else {
      console.log("Projects table already exists.");
    }
  } catch (error) {
    console.error("Error creating projects table:", error);
    throw error;
  }
}

// Function to check if a migration has already been run
async function hasMigrationRun(migrationName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('migrations')
      .select('id')
      .eq('name', migrationName)
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    return data !== null && data.length > 0;
  } catch (error) {
    console.error(`Error checking if migration ${migrationName} has run:`, error);
    return false;
  }
}

// Function to record that a migration has been run
async function recordMigration(migrationName: string) {
  try {
    const { error } = await supabase
      .from('migrations')
      .insert({ name: migrationName });
    
    if (error) {
      throw error;
    }
    console.log(`Migration ${migrationName} recorded successfully.`);
  } catch (error) {
    console.error(`Error recording migration ${migrationName}:`, error);
    throw error;
  }
}

// Example migration function (replace with your actual migration logic)
async function exampleMigration() {
  const migrationName = 'example_migration';
  
  try {
    if (await hasMigrationRun(migrationName)) {
      console.log(`Migration ${migrationName} already run, skipping.`);
      return;
    }
    
    console.log(`Running migration ${migrationName}...`);
    
    // Your migration logic here
    // For example, creating a new table:
    // const { error } = await supabase.rpc('exec_sql', {
    //   query: `CREATE TABLE example_table (id SERIAL PRIMARY KEY, name TEXT);`
    // });
    // if (error) {
    //   throw error;
    // }
    
    // Record the migration
    await recordMigration(migrationName);
    
  } catch (error) {
    console.error(`Error running migration ${migrationName}:`, error);
    throw error;
  }
}

// Run all migrations
async function runAllMigrations() {
  try {
    await exampleMigration();
    // Add more migrations here as needed
    return { success: true };
  } catch (error) {
    console.error("Failed to complete all migrations:", error);
    return { success: false, error };
  }
}

// Fixing the problematic catch usage
export async function runMigrations() {
  try {
    console.log("Checking database setup...");
    
    // Check if migrations table exists
    const { data: migrationsCheck, error: migrationsError } = await supabase
      .from('migrations')
      .select('*')
      .limit(1);
      
    if (migrationsError && migrationsError.code === '42P01') {
      console.error("Error checking migrations:", migrationsError);
      // Try to create migrations table
      await createMigrationsTable();
    }
    
    // Check if the projects table exists
    const { data: projectsCheck, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
      
    if (projectsError && projectsError.code === '42P01') {
      console.error("Error checking projects:", projectsError);
      // Try to create projects and related tables
      await createProjectsTable();
    }
    
    // Run all migrations in sequence
    return await runAllMigrations();
    
  } catch (error) {
    console.error("Migration error:", error);
    return { success: false, error };
  }
}
