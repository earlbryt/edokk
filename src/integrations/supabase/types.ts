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
      candidate_positions: {
        Row: {
          confidence: number
          created_at: string
          cv_file_id: string
          id: string
          position: string
        }
        Insert: {
          confidence: number
          created_at?: string
          cv_file_id: string
          id?: string
          position: string
        }
        Update: {
          confidence?: number
          created_at?: string
          cv_file_id?: string
          id?: string
          position?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_positions_cv_file_id_fkey"
            columns: ["cv_file_id"]
            isOneToOne: false
            referencedRelation: "cv_files"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_ratings: {
        Row: {
          created_at: string
          cv_file_id: string
          filter_group_id: string | null
          id: string
          project_id: string
          rating: string
          rating_reason: string | null
          requirement_scores: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cv_file_id: string
          filter_group_id?: string | null
          id?: string
          project_id: string
          rating: string
          rating_reason?: string | null
          requirement_scores?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cv_file_id?: string
          filter_group_id?: string | null
          id?: string
          project_id?: string
          rating?: string
          rating_reason?: string | null
          requirement_scores?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_ratings_cv_file_id_fkey"
            columns: ["cv_file_id"]
            isOneToOne: false
            referencedRelation: "cv_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_ratings_filter_group_id_fkey"
            columns: ["filter_group_id"]
            isOneToOne: false
            referencedRelation: "filter_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_ratings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_positions"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "candidate_ratings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_files: {
        Row: {
          error: string | null
          extraction_error: string | null
          id: string
          name: string
          parsed_data: Json | null
          progress: number | null
          project_id: string
          raw_text: string | null
          size: string
          status: string
          storage_path: string | null
          storage_url: string | null
          summary_id: string | null
          text_extracted: boolean | null
          text_extraction_date: string | null
          type: string
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          error?: string | null
          extraction_error?: string | null
          id: string
          name: string
          parsed_data?: Json | null
          progress?: number | null
          project_id: string
          raw_text?: string | null
          size: string
          status: string
          storage_path?: string | null
          storage_url?: string | null
          summary_id?: string | null
          text_extracted?: boolean | null
          text_extraction_date?: string | null
          type: string
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          error?: string | null
          extraction_error?: string | null
          id?: string
          name?: string
          parsed_data?: Json | null
          progress?: number | null
          project_id?: string
          raw_text?: string | null
          size?: string
          status?: string
          storage_path?: string | null
          storage_url?: string | null
          summary_id?: string | null
          text_extracted?: boolean | null
          text_extraction_date?: string | null
          type?: string
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_positions"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "cv_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cv_files_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      filter_groups: {
        Row: {
          created_at: string | null
          enabled: boolean
          id: string
          name: string
          position_id: string | null
          project_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean
          id: string
          name: string
          position_id?: string | null
          project_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean
          id?: string
          name?: string
          position_id?: string | null
          project_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "filter_groups_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filter_groups_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "project_positions"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "filter_groups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_positions"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "filter_groups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      filters: {
        Row: {
          created_at: string | null
          filter_group_id: string
          id: string
          required: boolean
          type: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          filter_group_id: string
          id: string
          required?: boolean
          type: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          filter_group_id?: string
          id?: string
          required?: boolean
          type?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "filters_filter_group_id_fkey"
            columns: ["filter_group_id"]
            isOneToOne: false
            referencedRelation: "filter_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          applied_at: string
          id: string
          name: string
        }
        Insert: {
          applied_at?: string
          id?: string
          name: string
        }
        Update: {
          applied_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      position_requirement_groups: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          name: string
          position_id: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          position_id: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          position_id?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "position_requirement_groups_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_requirement_groups_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "project_positions"
            referencedColumns: ["position_id"]
          },
          {
            foreignKeyName: "position_requirement_groups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_positions"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "position_requirement_groups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key_skills: string[]
          project_id: string | null
          qualifications: string[]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key_skills?: string[]
          project_id?: string | null
          qualifications?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key_skills?: string[]
          project_id?: string | null
          qualifications?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_positions"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "positions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          documents_count: number | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          documents_count?: number | null
          id: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          documents_count?: number | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      summaries: {
        Row: {
          awards: string[] | null
          certifications: string[] | null
          created_at: string | null
          cv_file_id: string | null
          education: string[] | null
          email: string | null
          experience: string[] | null
          extracted_data: Json | null
          id: string
          languages: string[] | null
          name: string | null
          phone: string | null
          projects: string[] | null
          publications: string[] | null
          raw_text: string | null
          skills: string[] | null
          suggested_positions: Json | null
          summary: string | null
          volunteer: string[] | null
        }
        Insert: {
          awards?: string[] | null
          certifications?: string[] | null
          created_at?: string | null
          cv_file_id?: string | null
          education?: string[] | null
          email?: string | null
          experience?: string[] | null
          extracted_data?: Json | null
          id?: string
          languages?: string[] | null
          name?: string | null
          phone?: string | null
          projects?: string[] | null
          publications?: string[] | null
          raw_text?: string | null
          skills?: string[] | null
          suggested_positions?: Json | null
          summary?: string | null
          volunteer?: string[] | null
        }
        Update: {
          awards?: string[] | null
          certifications?: string[] | null
          created_at?: string | null
          cv_file_id?: string | null
          education?: string[] | null
          email?: string | null
          experience?: string[] | null
          extracted_data?: Json | null
          id?: string
          languages?: string[] | null
          name?: string | null
          phone?: string | null
          projects?: string[] | null
          publications?: string[] | null
          raw_text?: string | null
          skills?: string[] | null
          suggested_positions?: Json | null
          summary?: string | null
          volunteer?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "summaries_cv_file_id_fkey"
            columns: ["cv_file_id"]
            isOneToOne: true
            referencedRelation: "cv_files"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      project_positions: {
        Row: {
          key_skills: string[] | null
          position_description: string | null
          position_id: string | null
          position_title: string | null
          project_id: string | null
          project_name: string | null
          qualifications: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      exec_sql: {
        Args: { query: string }
        Returns: undefined
      }
      get_summaries_for_cv_files: {
        Args: { cv_file_ids: string[] }
        Returns: {
          id: string
          cv_file_id: string
          created_at: string
          extracted_data: Json
          summary: string
          name: string
          email: string
          phone: string
          skills: string[]
          experience: string[]
          education: string[]
        }[]
      }
      pgfunction: {
        Args: { sql: string; params?: Json }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
