import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types' // Importante para el tipado

// Lee las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Valida que las variables de entorno estén presentes
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be defined in .env.local file");
}

// Crea y exporta el cliente de Supabase
// Usamos el tipo 'Database' para que TypeScript conozca tu esquema
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
