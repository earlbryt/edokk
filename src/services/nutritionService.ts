import { supabase } from "@/integrations/supabase/client";

// Force any type to work around Supabase TypeScript errors
// This is needed because our new tables aren't in the generated types
const db = supabase as any;

// Type definitions
export interface NutritionMessage {
  id?: string;
  user_id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  metadata?: any;
}

export interface NutritionProfile {
  id?: string;
  user_id?: string;
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  activity_level?: string;
  health_goals?: string[];
  dietary_restrictions?: string[];
  health_conditions?: string[];
  allergies?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface MealTrackingEntry {
  id?: string;
  user_id?: string;
  date: string;
  meal_type: string;
  foods: any;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  notes?: string;
  created_at?: string;
  ai_analyze?: boolean; // Flag to indicate if AI should analyze nutritional content
}

// Chat functions
export const sendChatMessage = async (userId: string, message: string, mealContext: any = {}) => {
  try {
    console.log('Sending chat message for user:', userId);
    const { data, error } = await db.functions.invoke('nutrition-chat', {
      body: { user_id: userId, message, meal_context: mealContext }
    });

    if (error) {
      console.error('Error response from nutrition-chat function:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Exception in sendChatMessage:', error);
    throw error;
  }
};

export const getChatHistory = async (userId: string, limit = 50) => {
  try {
    console.log('Fetching chat history for user:', userId);
    const { data, error } = await db
      .from('nutrition_chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error in getChatHistory:', error);
      return [];
    }
    return data as NutritionMessage[];
  } catch (error) {
    console.error('Exception in getChatHistory:', error);
    return [];
  }
};

// Profile functions
export const getNutritionProfile = async (userId: string) => {
  try {
    console.log('Fetching nutrition profile for user:', userId);
    const { data, error } = await db
      .from('nutrition_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no profile exists

    if (error) {
      console.error('Error in getNutritionProfile:', error);
      return null;
    }
    
    return data as NutritionProfile | null;
  } catch (error) {
    console.error('Exception in getNutritionProfile:', error);
    // Return null instead of throwing to prevent UI errors
    return null;
  }
};

export const saveNutritionProfile = async (profile: NutritionProfile) => {
  try {
    console.log('Saving nutrition profile for user:', profile.user_id);
    // Check if profile exists
    const { data: existingProfile } = await db
      .from('nutrition_profiles')
      .select('id')
      .eq('user_id', profile.user_id)
      .maybeSingle();

    if (existingProfile) {
      console.log('Updating existing profile:', existingProfile.id);
      // Update existing profile
      const { data, error } = await db
        .from('nutrition_profiles')
        .update({
          ...profile,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      return data as NutritionProfile;
    } else {
      console.log('Inserting new profile');
      // Insert new profile
      const { data, error } = await db
        .from('nutrition_profiles')
        .insert(profile)
        .select()
        .single();

      if (error) {
        console.error('Error inserting profile:', error);
        throw error;
      }
      return data as NutritionProfile;
    }
  } catch (error) {
    console.error('Exception in saveNutritionProfile:', error);
    throw error;
  }
};

// Meal tracking functions
export const saveMealEntry = async (entry: MealTrackingEntry) => {
  try {
    console.log('Saving meal entry for user:', entry.user_id);
    
    // Check if AI analysis is needed
    const shouldAnalyze = entry.ai_analyze || (!entry.calories && !entry.protein_g && !entry.carbs_g && !entry.fat_g);
    
    // If we need AI analysis, call the nutrition-analysis function
    if (shouldAnalyze) {
      console.log('Requesting AI nutrition analysis for meal');
      try {
        // First save the entry without nutritional data to get an ID
        const { data: savedEntry, error: saveError } = await db
          .from('meal_tracking')
          .insert({
            ...entry,
            ai_analyze: undefined // Remove this custom field as it's not in the database schema
          })
          .select()
          .single();
        
        if (saveError) {
          console.error('Error saving initial meal entry:', saveError);
          throw saveError;
        }
        
        // Then call AI function to analyze the nutritional content (meal analysis edge function)
        const { data: analysisData, error: analysisError } = await db.functions.invoke('nutrition-analysis', {
          body: { 
            meal_id: savedEntry.id,
            user_id: entry.user_id,
            foods: entry.foods,
            meal_type: entry.meal_type
          }
        });
        
        if (analysisError) {
          console.error('Error analyzing meal:', analysisError);
          // Return the saved entry even if analysis fails
          return savedEntry;
        }
        
        // If analysis was successful, update the entry with nutritional data
        if (analysisData && analysisData.success) {
          const { data: updatedEntry, error: updateError } = await db
            .from('meal_tracking')
            .update({
              calories: analysisData.calories,
              protein_g: analysisData.protein_g,
              carbs_g: analysisData.carbs_g,
              fat_g: analysisData.fat_g
            })
            .eq('id', savedEntry.id)
            .select()
            .single();
            
          if (updateError) {
            console.error('Error updating meal with nutritional data:', updateError);
            return savedEntry;
          }
          
          return updatedEntry;
        }
        
        return savedEntry;
      } catch (analysisException) {
        console.error('Exception during meal analysis:', analysisException);
        // Continue with saving without nutritional data if analysis fails
        const { data: fallbackEntry, error: fallbackError } = await db
          .from('meal_tracking')
          .insert({
            ...entry,
            ai_analyze: undefined
          })
          .select()
          .single();
          
        if (fallbackError) {
          console.error('Error in fallback meal entry save:', fallbackError);
          throw fallbackError;
        }
        
        return fallbackEntry;
      }
    } else {
      // If we don't need AI analysis, just save the entry as is
      const { data, error } = await db
        .from('meal_tracking')
        .insert({
          ...entry,
          ai_analyze: undefined // Remove this custom field
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving meal entry:', error);
        throw error;
      }
      return data;
    }
  } catch (error) {
    console.error('Exception in saveMealEntry:', error);
    throw error;
  }
};

export const getMealEntries = async (userId: string, startDate: string, endDate: string) => {
  try {
    console.log('Fetching meal entries for user:', userId, 'from', startDate, 'to', endDate);
    const { data, error } = await db
      .from('meal_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching meal entries:', error);
      return [];
    }
    return data as MealTrackingEntry[];
  } catch (error) {
    console.error('Exception in getMealEntries:', error);
    return [];
  }
};
