import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { uploadToCloudinary } from '../lib/cloudinary'
import type { User, Session } from '@supabase/supabase-js'
import type { ThemeKey } from '../lib/fruitTheme'
import { THEMES, getThemeKeyFromEmail, isThemeKey } from '../lib/fruitTheme'

const THEME_STORAGE_KEY = 'sponty_fruit_theme'

const ALLOWED_EMAILS = [
  'david@sponty.app',
  'leslie@sponty.app',
  'shane@sponty.app',
  'paul@sponty.app',
  // Backward compatibility with old domain
  'david@pamati.app',
  'leslie@pamati.app',
  'shane@pamati.app',
  'paul@pamati.app',
]

interface UserProfile {
  id: string
  email: string
  name: string
  avatar_url: string | null
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  fruitTheme: ThemeKey | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string, fruitTheme?: ThemeKey) => Promise<void>
  signOut: () => Promise<void>
  fetchProfile: (userId: string) => Promise<void>
  initialize: () => Promise<void>
  updateProfile: (fields: { name?: string; avatar_url?: string }) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  uploadAvatar: (file: File) => Promise<string | null>
}

function resolveStoredTheme(userEmail: string | undefined): ThemeKey | null {
  const fromEmail = getThemeKeyFromEmail(userEmail)
  if (!fromEmail) return null
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    const normalized = userEmail?.toLowerCase().trim() ?? ''
    if (raw && isThemeKey(raw) && THEMES[raw].email === normalized) return raw
  } catch {
    /* ignore */
  }
  return fromEmail
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  fruitTheme: null,
  loading: true,
  error: null,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const theme = resolveStoredTheme(session.user.email)
      set({ user: session.user, session, fruitTheme: theme })
      await get().fetchProfile(session.user.id)
    }
    set({ loading: false })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const theme = resolveStoredTheme(session.user.email)
        set({ user: session.user, session, fruitTheme: theme })
        await get().fetchProfile(session.user.id)
      } else {
        set({ user: null, session: null, profile: null, fruitTheme: null })
      }
    })
  },

  signIn: async (email: string, password: string, chosenFruit?: ThemeKey) => {
    set({ error: null, loading: true })

    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      set({ error: 'Access restricted. This app is private.', loading: false })
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      set({ error: error.message, loading: false })
      return
    }

    const normalized = email.toLowerCase().trim()
    const fromLogin = chosenFruit && getThemeKeyFromEmail(normalized) === chosenFruit ? chosenFruit : null
    const theme = fromLogin ?? getThemeKeyFromEmail(data.user?.email) ?? 'strawberry'

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }

    set({ user: data.user, session: data.session, fruitTheme: theme })
    if (data.user) await get().fetchProfile(data.user.id)
    set({ loading: false })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    try {
      localStorage.removeItem(THEME_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    set({ user: null, session: null, profile: null, fruitTheme: null })
  },

  fetchProfile: async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) {
      set({ profile: data as UserProfile })
    }
  },

  updateProfile: async (fields) => {
    const { profile } = get()
    if (!profile) return { error: 'Not logged in' }

    // Apply optimistically so the UI updates immediately
    set({ profile: { ...profile, ...fields } })

    const { error } = await supabase
      .from('users')
      .update(fields)
      .eq('id', profile.id)

    if (error) {
      // Roll back on failure
      set({ profile })
      return { error: error.message }
    }

    return { error: null }
  },

  updatePassword: async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: error.message }
    return { error: null }
  },

  uploadAvatar: async (file: File) => {
    const { profile } = get()
    if (!profile) return null

    // Compress & resize to 256×256 JPEG before uploading — far smaller payload
    const compressed = await compressAvatar(file, 256, 0.82)

    try {
      return await uploadToCloudinary(compressed)
    } catch (err) {
      console.error('[uploadAvatar]', err)
      return null
    }
  },
}))

/** Resize + compress an image File to a square canvas, returns a Blob as JPEG. */
function compressAvatar(file: File, size: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      // Centre-crop to square
      const s = Math.min(img.width, img.height)
      const ox = (img.width - s) / 2
      const oy = (img.height - s) / 2
      ctx.drawImage(img, ox, oy, s, s, 0, 0, size, size)
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        quality,
      )
    }
    img.onerror = reject
    img.src = url
  })
}
