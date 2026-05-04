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
  fetch: () => Promise<void>
  upload: (file: File, tags: string[], caption?: string) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  setActiveTag: (tag: string) => void
  setLightbox: (item: GalleryItem | null) => void
  filteredItems: () => GalleryItem[]
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  items: [],
  loading: false,
  uploadError: null,
  activeTag: 'All',
  lightboxImage: null,

  fetch: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) set({ items: data as GalleryItem[] })
    set({ loading: false })
  },

  upload: async (file, tags, caption) => {
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
      const publicUrl = await uploadToCloudinary(file)

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
      set(state => ({
        items: state.items.map(i => i.id === tempId ? (inserted as GalleryItem) : i),
      }))
    } catch (err) {
      console.error('[Gallery] Upload failed, rolling back preview:', err)
      URL.revokeObjectURL(previewUrl)
      set(state => ({ items: state.items.filter(i => i.id !== tempId) }))
      const msg = err instanceof Error ? err.message : 'Upload failed. Please try again.'
      set({ uploadError: msg })
      setTimeout(() => set({ uploadError: null }), 6000)
    }
  },

  deleteItem: async (id) => {
    set(s => ({ items: s.items.filter(i => i.id !== id) }))
    await supabase.from('gallery').delete().eq('id', id)
    // Cloudinary asset cleanup requires server-side auth; removing the DB row is sufficient.
  },

  setActiveTag: (tag) => set({ activeTag: tag }),
  setLightbox: (item) => set({ lightboxImage: item }),

  filteredItems: () => {
    const { items, activeTag } = get()
    return items.filter(i => itemMatchesTag(i.tags, activeTag))
  },
}))
