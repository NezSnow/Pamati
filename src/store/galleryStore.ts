import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { uploadToCloudinary } from '../lib/cloudinary'

export interface GalleryItem {
  id: string
  image_url: string
  tags: string[]
  caption: string | null
  created_at: string
}

export const GALLERY_TAGS = ['All', 'Drew', 'Lengua', 'Shen', 'Paul']
export const COMBO_TAGS = ['Drew & Shen', 'Drew & Lengua', 'Lengua & Paul', 'Shen & Paul']
export const ALL_TAGS = [...GALLERY_TAGS, ...COMBO_TAGS]

// Maps legacy tag names (stored in DB before renaming) to the current display names.
const LEGACY_MAP: Record<string, string> = {
  david: 'drew',
  leslie: 'lengua',
  shane: 'shen',
}

/** Normalise a stored tag so it can be compared case-insensitively and handles legacy names. */
function normalise(tag: string): string {
  const lower = tag.toLowerCase()
  return LEGACY_MAP[lower] ?? lower
}

/** Returns true when the gallery item's tags satisfy the active filter. */
function itemMatchesTag(itemTags: string[], activeTag: string): boolean {
  if (activeTag === 'All') return true
  if (activeTag.includes('&')) {
    const parts = activeTag.split(' & ').map(p => normalise(p))
    return parts.every(p => itemTags.some(t => normalise(t) === p))
  }
  const target = normalise(activeTag)
  return itemTags.some(t => normalise(t) === target)
}

interface GalleryState {
  items: GalleryItem[]
  loading: boolean
  uploadError: string | null
  activeTag: string
  lightboxImage: GalleryItem | null
  fetch: (opts?: { force?: boolean }) => Promise<void>
  upload: (file: File, tags: string[], caption?: string, onProgress?: (percent: number) => void) => Promise<void>
  saveUrl: (imageUrl: string, tags: string[], caption?: string) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  setActiveTag: (tag: string) => void
  setLightbox: (item: GalleryItem | null) => void
  filteredItems: () => GalleryItem[]
}

let galleryFetchInFlight: Promise<void> | null = null
let galleryLastFetchedAt = 0
const GALLERY_CACHE_MS = 60_000

export const useGalleryStore = create<GalleryState>((set, get) => ({
  items: [],
  loading: false,
  uploadError: null,
  activeTag: 'All',
  lightboxImage: null,

  fetch: async (opts) => {
    const hasCache = get().items.length > 0
    if (!opts?.force && hasCache && Date.now() - galleryLastFetchedAt < GALLERY_CACHE_MS) {
      return
    }
    if (galleryFetchInFlight) return galleryFetchInFlight

    if (!hasCache) set({ loading: true })

    galleryFetchInFlight = (async () => {
      try {
        const { data, error } = await supabase
          .from('gallery')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) console.error('[galleryStore] fetch error:', error)
        if (data) {
          galleryLastFetchedAt = Date.now()
          set({ items: data as GalleryItem[] })
        }
      } finally {
        set({ loading: false })
        galleryFetchInFlight = null
      }
    })()

    return galleryFetchInFlight
  },

  upload: async (file, tags, caption, onProgress) => {
    // Show optimistic preview immediately using local blob URL
    const tempId = `temp-${Date.now()}`
    const previewUrl = URL.createObjectURL(file)
    const tempItem: GalleryItem = {
      id: tempId,
      image_url: previewUrl,
      tags,
      caption: caption || null,
      created_at: new Date().toISOString(),
    }
    set(state => ({ items: [tempItem, ...state.items] }))

    try {
      // Upload to Cloudinary, then save URL to database
      const publicUrl = await uploadToCloudinary(file, onProgress)

      const { data: inserted, error: insertError } = await supabase.from('gallery').insert({
        image_url: publicUrl,
        tags,
        caption: caption || null,
      }).select().single()

      if (insertError || !inserted) {
        console.error('[Gallery] Supabase insert failed:', insertError)
        throw new Error(
          insertError?.message
            ? `Could not save photo (database): ${insertError.message}`
            : 'Could not save photo to the database.',
        )
      }

      URL.revokeObjectURL(previewUrl)
      // Replace the temp item immediately, then force a fresh fetch so all
      // devices / sessions (e.g. phone uploader + desktop viewer) stay in sync.
      set(state => ({
        items: state.items.map(i => i.id === tempId ? (inserted as GalleryItem) : i),
      }))
      galleryLastFetchedAt = 0 // invalidate cache so next fetch hits the DB
    } catch (err) {
      console.error('[Gallery] Upload failed, rolling back preview:', err)
      URL.revokeObjectURL(previewUrl)
      set(state => ({ items: state.items.filter(i => i.id !== tempId) }))
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.'
      set({ uploadError: msg })
      setTimeout(() => set({ uploadError: null }), 6000)
      throw err
    }
  },

  deleteItem: async (id) => {
    set(s => ({ items: s.items.filter(i => i.id !== id) }))
    await supabase.from('gallery').delete().eq('id', id)
    // Cloudinary asset cleanup requires server-side auth; removing the DB row is sufficient.
  },

  saveUrl: async (imageUrl, tags, caption) => {
    const { data: inserted, error: insertError } = await supabase
      .from('gallery')
      .insert({ image_url: imageUrl, tags, caption: caption || null })
      .select()
      .single()

    if (insertError || !inserted) {
      const msg = insertError?.message ?? 'Could not save photo to the database.'
      set({ uploadError: msg })
      setTimeout(() => set({ uploadError: null }), 6000)
      throw new Error(msg)
    }

    galleryLastFetchedAt = 0
    set(state => ({ items: [inserted as GalleryItem, ...state.items] }))
  },

  setActiveTag: (tag) => set({ activeTag: tag }),
  setLightbox: (item) => set({ lightboxImage: item }),

  filteredItems: () => {
    const { items, activeTag } = get()
    return items.filter(i => itemMatchesTag(i.tags, activeTag))
  },
}))
