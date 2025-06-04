export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assessment_questions: {
        Row: {
          assessment_id: string
          created_at: string | null
          id: string
          question_order: number
          question_text: string
          response_options: Json | null
          response_type: string
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          id?: string
          question_order: number
          question_text: string
          response_options?: Json | null
          response_type: string
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          id?: string
          question_order?: number
          question_text?: string
          response_options?: Json | null
          response_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "mental_health_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          additional_notes: string | null
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at: string
          doctor_id: string | null
          email: string
          full_name: string
          id: string
          preferred_date: string
          preferred_time: string
          status: Database["public"]["Enums"]["consultation_status"]
          symptoms: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_notes?: string | null
          consultation_type: Database["public"]["Enums"]["consultation_type"]
          created_at?: string
          doctor_id?: string | null
          email: string
          full_name: string
          id?: string
          preferred_date: string
          preferred_time: string
          status?: Database["public"]["Enums"]["consultation_status"]
          symptoms: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_notes?: string | null
          consultation_type?: Database["public"]["Enums"]["consultation_type"]
          created_at?: string
          doctor_id?: string | null
          email?: string
          full_name?: string
          id?: string
          preferred_date?: string
          preferred_time?: string
          status?: Database["public"]["Enums"]["consultation_status"]
          symptoms?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      herbal_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          background_color: string | null
          created_at: string | null
          description: string | null
          duration: string | null
          health_condition: string | null
          id: string
          image_url: string | null
          name: string
          price: number | null
          restrictions: string[] | null
        }
        Insert: {
          background_color?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          health_condition?: string | null
          id?: string
          image_url?: string | null
          name: string
          price?: number | null
          restrictions?: string[] | null
        }
        Update: {
          background_color?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          health_condition?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number | null
          restrictions?: string[] | null
        }
        Relationships: []
      }
      meal_tracking: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string
          date: string
          fat_g: number | null
          foods: Json
          id: string
          meal_type: string
          notes: string | null
          protein_g: number | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          date?: string
          fat_g?: number | null
          foods: Json
          id?: string
          meal_type: string
          notes?: string | null
          protein_g?: number | null
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          date?: string
          fat_g?: number | null
          foods?: Json
          id?: string
          meal_type?: string
          notes?: string | null
          protein_g?: number | null
          user_id?: string
        }
        Relationships: []
      }
      mental_health_assessments: {
        Row: {
          created_at: string | null
          description: string
          id: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      nutrition_assessments: {
        Row: {
          created_at: string
          id: string
          recommendations: Json | null
          responses: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recommendations?: Json | null
          responses: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recommendations?: Json | null
          responses?: Json
          user_id?: string
        }
        Relationships: []
      }
      nutrition_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string[] | null
          created_at: string
          dietary_restrictions: string[] | null
          gender: string | null
          health_conditions: string[] | null
          health_goals: string[] | null
          height: number | null
          id: string
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          created_at?: string
          dietary_restrictions?: string[] | null
          gender?: string | null
          health_conditions?: string[] | null
          health_goals?: string[] | null
          height?: number | null
          id?: string
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          created_at?: string
          dietary_restrictions?: string[] | null
          gender?: string | null
          health_conditions?: string[] | null
          health_goals?: string[] | null
          height?: number | null
          id?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number
          product_id: string
          product_name: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          product_id: string
          product_name: string
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          product_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          id: string
          payment_method: string
          shipping_address: Json
          status: string
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_method: string
          shipping_address: Json
          status?: string
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_method?: string
          shipping_address?: Json
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          email: string | null
          id: string
          name: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          id: string
          name?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_assessments: {
        Row: {
          assessment_id: string
          created_at: string | null
          id: string
          llm_feedback: string | null
          responses: Json
          result_category: string | null
          score: number | null
          user_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          id?: string
          llm_feedback?: string | null
          responses: Json
          result_category?: string | null
          score?: number | null
          user_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          id?: string
          llm_feedback?: string | null
          responses?: Json
          result_category?: string | null
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_assessments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "mental_health_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_profiles_by_ids: {
        Args: { user_ids: string[] }
        Returns: {
          avatar_url: string | null
          email: string | null
          id: string
          name: string | null
          role: string
          updated_at: string | null
        }[]
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_profile_owner: {
        Args: { profile_id_to_check: string }
        Returns: boolean
      }
      table_exists: {
        Args: { table_name: string }
        Returns: boolean
      }
    }
    Enums: {
      consultation_status: "pending" | "confirmed" | "cancelled" | "completed"
      consultation_type: "virtual" | "in_person"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      consultation_status: ["pending", "confirmed", "cancelled", "completed"],
      consultation_type: ["virtual", "in_person"],
    },
  },
} as const
