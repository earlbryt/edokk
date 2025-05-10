import { supabase } from '@/integrations/supabase/client';

// Function to create the migrations table if it doesn't exist
async function createMigrationsTable() {
  try {
    console.log("Creating migrations table...");
    const { error } = await supabase.schema.hasTable('migrations');
    
    if (error) {
      const { error: createError } = await supabase.schema.createTable('migrations', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable().unique();
        table.timestamp('created_at', { useTz: true }).defaultTo('now()');
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
    const { error } = await supabase.schema.hasTable('projects');
    
    if (error) {
      // Create the projects table
      const { error: createError } = await supabase.schema.createTable('projects', (table) => {
        table.uuid('id').primary();
        table.foreign('user_id').references('users.id').onDelete('CASCADE');
        table.string('name').notNullable();
        table.timestamp('created_at', { useTz: true }).defaultTo('now()');
        table.timestamp('updated_at', { useTz: true }).defaultTo('now()');
        table.integer('documents_count').defaultTo(0);
      });
      
      if (createError) {
        throw createError;
      }
      console.log("Projects table created successfully.");
      
      // Create the cv_files table
      const { error: createFilesError } = await supabase.schema.createTable('cv_files', (table) => {
        table.uuid('id').primary();
        table.foreign('user_id').references('users.id').onDelete('CASCADE');
        table.foreign('project_id').references('projects.id').onDelete('CASCADE');
        table.string('name').notNullable();
        table.string('size');
        table.string('type');
        table.string('status');
        table.integer('progress');
        table.string('storage_path');
        table.string('storage_url');
        table.timestamp('uploaded_at', { useTz: true }).defaultTo('now()');
        table.text('raw_text');
        table.boolean('text_extracted').defaultTo(false);
        table.timestamp('text_extraction_date', { useTz: true });
        table.jsonb('parsed_data');
        table.text('extraction_error');
      });
      
      if (createFilesError) {
        throw createFilesError;
      }
      console.log("CV Files table created successfully.");

      // Create the filter_groups table
      const { error: createFilterGroupsError } = await supabase.schema.createTable('filter_groups', (table) => {
        table.uuid('id').primary();
        table.foreign('user_id').references('users.id').onDelete('CASCADE');
        table.foreign('project_id').references('projects.id').onDelete('CASCADE');
        table.string('name').notNullable();
        table.boolean('enabled').defaultTo(true);
        table.timestamp('created_at', { useTz: true }).defaultTo('now()');
        table.timestamp('updated_at', { useTz: true }).defaultTo('now()');
      });

      if (createFilterGroupsError) {
        throw createFilterGroupsError;
      }
      console.log("Filter Groups table created successfully.");

      // Create the filters table
      const { error: createFiltersError } = await supabase.schema.createTable('filters', (table) => {
        table.uuid('id').primary();
        table.foreign('filter_group_id').references('filter_groups.id').onDelete('CASCADE');
        table.string('name').notNullable();
        table.string('value').notNullable();
        table.timestamp('created_at', { useTz: true }).defaultTo('now()');
        table.timestamp('updated_at', { useTz: true }).defaultTo('now()');
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
    // const { error } = await supabase.schema.createTable('example_table', (table) => {
    //   table.increments('id').primary();
    //   table.string('name');
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
  } catch (error) {
    console.error("Failed to complete all migrations:", error);
  }
}

// Only modify the problematic catch usage
export async function runMigrations() {
  try {
    console.log("Checking database setup...");
    
    // Check if migrations table exists
    const { data: migrationsCheck, error: migrationsError } = await supabase
      .from('migrations')
      .select('*')
      .limit(1);
      
    if (migrationsError) {
      console.error("Error checking migrations:", migrationsError);
      // Try to create migrations table
      await createMigrationsTable();
    }
    
    // Check if the projects table exists
    const { data: projectsCheck, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
      
    if (projectsError) {
      console.error("Error checking projects:", projectsError);
      // Try to create projects and related tables
      await createProjectsTable();
    }
    
    // Run all migrations in sequence
    await runAllMigrations();
    
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    console.warn("Some migration steps failed, but application will continue");
  }
}
