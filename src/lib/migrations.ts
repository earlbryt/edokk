
import { supabase } from '@/integrations/supabase/client';

// Helper function to check if a particular table exists
async function tableExists(tableName: string) {
  const { data, error } = await supabase
    .from('pg_tables')
    .select('*')
    .eq('tablename', tableName)
    .eq('schemaname', 'public');
  
  if (error) {
    console.error('Error checking if table exists:', error);
    return false;
  }
  
  return data && data.length > 0;
}

// Setup function for the health platform
async function setupHealthPlatform() {
  console.log("Setting up health platform...");
  
  // We would create necessary tables for the health platform here
  // but we're using SQL migrations via Supabase now
  
  return { success: true };
}

// Main exported function
export async function runMigrations() {
  console.log("Running migrations for health platform...");
  
  try {
    // Check if we need to set up the health platform by verifying if profiles table exists
    const profilesExist = await tableExists('profiles');
    
    if (!profilesExist) {
      console.log("Profiles table does not exist. Please create it using SQL migrations.");
    } else {
      console.log("Profiles table already exists.");
    }
    
    // Run platform setup if needed
    const result = await setupHealthPlatform();
    
    return { success: result.success };
  } catch (error) {
    console.error("Error running migrations:", error);
    return { success: false, error };
  }
}
