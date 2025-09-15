// Este archivo lo puedes generar automáticamente con el CLI de Supabase
// para que siempre esté sincronizado con tu base de datos.
// Comando: npx supabase gen types typescript --project-id TU_ID > src/types/database.types.ts
// Por ahora, he creado una versión simplificada.

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
      appointments: {
        Row: {
          id: string
          client_id: string
          service_id: number
          professional_id: string
          start_time: string
          end_time: string
          status: string
          notes: string | null
          created_at: string
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
      }
      clients: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          email: string | null
          nickname: string | null
          created_at: string
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
      }
      services: {
        Row: {
          id: number
          name: string
          category: string | null
          duration: number
          break_time: number
          price: number
          created_at: string
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
      }
      // ... resto de tablas
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
