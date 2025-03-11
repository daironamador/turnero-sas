
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tickets: {
        Row: {
          id: string
          ticket_number: string
          service_type: string
          status: string
          is_vip: boolean
          created_at: string
          called_at: string | null
          completed_at: string | null
          counter_number: number | null
          patient_name: string | null
          redirected_to: string | null
          redirected_from: string | null
          previous_ticket_number: string | null
        }
        Insert: {
          id?: string
          ticket_number: string
          service_type: string
          status: string
          is_vip?: boolean
          created_at?: string
          called_at?: string | null
          completed_at?: string | null
          counter_number?: number | null
          patient_name?: string | null
          redirected_to?: string | null
          redirected_from?: string | null
          previous_ticket_number?: string | null
        }
        Update: {
          id?: string
          ticket_number?: string
          service_type?: string
          status?: string
          is_vip?: boolean
          created_at?: string
          called_at?: string | null
          completed_at?: string | null
          counter_number?: number | null
          patient_name?: string | null
          redirected_to?: string | null
          redirected_from?: string | null
          previous_ticket_number?: string | null
        }
      }
      services: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          number: string
          name: string
          service_id: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          number: string
          name: string
          service_id: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          number?: string
          name?: string
          service_id?: string
          is_active?: boolean
          created_at?: string
        }
      }
      company_settings: {
        Row: {
          id: string
          name: string
          address: string
          phone: string
          email: string
          logo: string | null
          ticket_footer: string | null
          display_message: string | null
        }
        Insert: {
          id?: string
          name: string
          address: string
          phone: string
          email: string
          logo?: string | null
          ticket_footer?: string | null
          display_message?: string | null
        }
        Update: {
          id?: string
          name?: string
          address?: string
          phone?: string
          email?: string
          logo?: string | null
          ticket_footer?: string | null
          display_message?: string | null
        }
      }
      users: {
        Row: {
          id: string
          username: string
          name: string
          email: string
          role: string
          is_active: boolean
          service_ids: string[]
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          name: string
          email: string
          role?: string
          is_active?: boolean
          service_ids?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          name?: string
          email?: string
          role?: string
          is_active?: boolean
          service_ids?: string[]
          created_at?: string
        }
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
  }
}
