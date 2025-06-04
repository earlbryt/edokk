
export interface ConsultationData {
  id: string;
  user_id: string;
  consultation_type: 'virtual' | 'in_person';
  preferred_date: string;
  preferred_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  doctor_id?: string;
  full_name: string;
  email: string;
  symptoms: string[];
  additional_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthProfile {
  id: string;
  user_id: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  allergies?: string[];
  health_conditions?: string[];
  medications?: string[];
  created_at: string;
  updated_at: string;
}

export interface NutritionProfile {
  id: string;
  user_id: string;
  height?: number;
  weight?: number;
  age?: number;
  gender?: string;
  activity_level?: string;
  health_goals?: string[];
  dietary_restrictions?: string[];
  allergies?: string[];
  health_conditions?: string[];
  created_at: string;
  updated_at: string;
}
