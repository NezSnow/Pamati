import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env — restart the dev server after adding them.',
  )
}

/** Turn raw Supabase / fetch errors into something actionable in the UI. */
export function formatAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('load failed')
  ) {
    return (
      'Cannot reach the database server. The Supabase project may be paused, deleted, or the URL in .env is wrong. ' +
      'Open supabase.com/dashboard, restore or recreate the project, then update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    )
  }
  return message
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder',
)

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
