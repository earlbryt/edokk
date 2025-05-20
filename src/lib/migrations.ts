
import { supabase } from '@/integrations/supabase/client';

// Helper function to check if a particular table exists
async function tableExists(tableName: string) {
  try {
    const { data, error } = await supabase.rpc('table_exists', { table_name: tableName });
    
    if (error) {
      console.error('Error checking if table exists:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error in tableExists function:', error);
    return false;
  }
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
    
    // Check if consultations table exists
    const consultationsExist = await tableExists('consultations');
    
    if (!consultationsExist) {
      console.log("Consultations table does not exist. Please create it using SQL migrations.");
    } else {
      console.log("Consultations table already exists.");
    }
    
    // Run platform setup if needed
    const result = await setupHealthPlatform();
    
    return { success: result.success };
  } catch (error) {
    console.error("Error running migrations:", error);
    return { success: false, error };
  }
}
