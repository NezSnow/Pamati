import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          created_at: string
        }
      }
      memories: {
        Row: {
          id: string
          title: string
          description: string
          date: string
          created_by: string
          created_at: string
        }
      }
      memory_images: {
        Row: {
          id: string
          memory_id: string
          image_url: string
          created_at: string
        }
      }
      gallery: {
        Row: {
          id: string
          image_url: string
          tags: string[]
          caption: string | null
          created_at: string
        }
      }
      bucket_list: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'planned' | 'completed'
          created_by: string
          created_at: string
          completed_at: string | null
        }
      }
    }
  }
}
