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
}

// Chat functions
export const sendChatMessage = async (userId: string, message: string) => {
  try {
    console.log('Sending chat message for user:', userId);
    const { data, error } = await db.functions.invoke('nutrition-chat', {
      body: { user_id: userId, message }
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
    const { data, error } = await db
      .from('meal_tracking')
      .insert(entry)
      .select()
      .single();

    if (error) {
      console.error('Error saving meal entry:', error);
      throw error;
    }
    return data;
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
