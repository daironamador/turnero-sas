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
      company_settings: {
        Row: {
          address: string
          display_message: string | null
          email: string
          id: string
          logo: string | null
          name: string
          phone: string
          ticket_footer: string | null
        }
        Insert: {
          address: string
          display_message?: string | null
          email: string
          id?: string
          logo?: string | null
          name: string
          phone: string
          ticket_footer?: string | null
        }
        Update: {
          address?: string
          display_message?: string | null
          email?: string
          id?: string
          logo?: string | null
          name?: string
          phone?: string
          ticket_footer?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          active: boolean
          content: string
          created_at: string
          id: string
          image_url: string | null
          interval_in_seconds: number
          title: string
          type: string
          youtube_url: string | null
        }
        Insert: {
          active?: boolean
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          interval_in_seconds?: number
          title: string
          type: string
          youtube_url?: string | null
        }
        Update: {
          active?: boolean
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          interval_in_seconds?: number
          title?: string
          type?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          number: string
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          number: string
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          number?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          called_at: string | null
          completed_at: string | null
          counter_number: string | null
          created_at: string
          id: string
          is_vip: boolean
          patient_name: string | null
          previous_ticket_number: string | null
          redirected_from: string | null
          redirected_to: string | null
          service_type: string
          status: string
          ticket_number: string
        }
        Insert: {
          called_at?: string | null
          completed_at?: string | null
          counter_number?: string | null
          created_at?: string
          id?: string
          is_vip?: boolean
          patient_name?: string | null
          previous_ticket_number?: string | null
          redirected_from?: string | null
          redirected_to?: string | null
          service_type: string
          status: string
          ticket_number: string
        }
        Update: {
          called_at?: string | null
          completed_at?: string | null
          counter_number?: string | null
          created_at?: string
          id?: string
          is_vip?: boolean
          patient_name?: string | null
          previous_ticket_number?: string | null
          redirected_from?: string | null
          redirected_to?: string | null
          service_type?: string
          status?: string
          ticket_number?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          role: string
          service_ids: string[]
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          role?: string
          service_ids?: string[]
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          role?: string
          service_ids?: string[]
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
