import { supabase } from "@/integrations/supabase/client";

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
    const { data, error } = await supabase.functions.invoke('nutrition-chat', {
      body: { user_id: userId, message }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

export const getChatHistory = async (userId: string, limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('nutrition_chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data as NutritionMessage[];
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

// Profile functions
export const getNutritionProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('nutrition_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as NutritionProfile | null;
  } catch (error) {
    console.error('Error fetching nutrition profile:', error);
    throw error;
  }
};

export const saveNutritionProfile = async (profile: NutritionProfile) => {
  try {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('nutrition_profiles')
      .select('id')
      .eq('user_id', profile.user_id)
      .single();

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('nutrition_profiles')
        .update({
          ...profile,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (error) throw error;
      return data as NutritionProfile;
    } else {
      // Insert new profile
      const { data, error } = await supabase
        .from('nutrition_profiles')
        .insert(profile)
        .select()
        .single();

      if (error) throw error;
      return data as NutritionProfile;
    }
  } catch (error) {
    console.error('Error saving nutrition profile:', error);
    throw error;
  }
};

// Meal tracking functions
export const saveMealEntry = async (entry: MealTrackingEntry) => {
  try {
    const { data, error } = await supabase
      .from('meal_tracking')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving meal entry:', error);
    throw error;
  }
};

export const getMealEntries = async (userId: string, startDate: string, endDate: string) => {
  try {
    const { data, error } = await supabase
      .from('meal_tracking')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data as MealTrackingEntry[];
  } catch (error) {
    console.error('Error fetching meal entries:', error);
    throw error;
  }
};
