import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { uploadToCloudinary } from '../lib/cloudinary'

export interface Memory {
  id: string
  title: string
  description: string
  date: string
  created_by: string
  created_at: string
  images?: MemoryImage[]
}

export interface MemoryImage {
  id: string
  memory_id: string
  image_url: string
}

interface MemoriesState {
  memories: Memory[]
  loading: boolean
  selectedMemory: Memory | null
  fetch: (opts?: { force?: boolean }) => Promise<void>
  create: (data: Omit<Memory, 'id' | 'created_at' | 'images'>, images: File[]) => Promise<void>
  updateMemory: (id: string, fields: { title?: string; description?: string; date?: string }) => Promise<{ error: string | null }>
  addImages: (memoryId: string, files: File[]) => Promise<MemoryImage[]>
  removeImage: (image: MemoryImage) => Promise<{ error: string | null }>
  setSelected: (memory: Memory | null) => void
}

let memoriesFetchInFlight: Promise<void> | null = null
let memoriesLastFetchedAt = 0
const MEMORIES_CACHE_MS = 60_000

export const useMemoriesStore = create<MemoriesState>((set, get) => ({
  memories: [],
  loading: false,
  selectedMemory: null,

  fetch: async (opts) => {
    const hasCache = get().memories.length > 0
    if (
      !opts?.force &&
      hasCache &&
      Date.now() - memoriesLastFetchedAt < MEMORIES_CACHE_MS
    ) {
      return
    }
    if (memoriesFetchInFlight) return memoriesFetchInFlight

    if (!hasCache) set({ loading: true })

    memoriesFetchInFlight = (async () => {
      try {
        const [memoriesResult, imagesResult] = await Promise.all([
          supabase.from('memories').select('*').order('date', { ascending: false }),
          supabase.from('memory_images').select('*'),
        ])

        if (memoriesResult.error) {
          console.error('[memoriesStore] fetch memories error:', memoriesResult.error)
          return
        }
        if (imagesResult.error) {
          console.error('[memoriesStore] fetch images error:', imagesResult.error)
        }

        const memories = memoriesResult.data ?? []
        const allImages = imagesResult.data ?? []

        const memoriesWithImages = memories.map(m => ({
          ...m,
          images: allImages.filter(img => img.memory_id === m.id),
        }))

        memoriesLastFetchedAt = Date.now()
        set({ memories: memoriesWithImages as Memory[] })
      } finally {
        set({ loading: false })
        memoriesFetchInFlight = null
      }
    })()

    return memoriesFetchInFlight
  },

  create: async (data, imageFiles) => {
    const { data: memory, error } = await supabase
      .from('memories')
      .insert(data)
      .select()
      .single()

    if (error || !memory) return

    const uploadPromises = imageFiles.map(async (file) => {
      try {
        const imageUrl = await uploadToCloudinary(file)
        const { data: img } = await supabase.from('memory_images').insert({
          memory_id: memory.id,
          image_url: imageUrl,
        }).select().single()
        return img ? (img as MemoryImage) : null
      } catch (err) {
        console.error('Image upload failed', err)
        return null
      }
    })

    const newImagesResults = await Promise.all(uploadPromises)
    const newImages = newImagesResults.filter((img): img is MemoryImage => img !== null)

    const newMemory: Memory = { ...memory, images: newImages }
    set(s => ({ memories: [newMemory, ...s.memories] }))
  },

  updateMemory: async (id, fields) => {
    // Optimistic update
    set(s => ({
      memories: s.memories.map(m => m.id === id ? { ...m, ...fields } : m),
    }))

    const { error } = await supabase.from('memories').update(fields).eq('id', id)
    if (error) {
      // Revert
      await get().fetch({ force: true })
      return { error: error.message }
    }
    return { error: null }
  },

  addImages: async (memoryId, files) => {
    const uploadPromises = files.map(async (file) => {
      try {
        const imageUrl = await uploadToCloudinary(file)
        const { data: img } = await supabase.from('memory_images').insert({
          memory_id: memoryId,
          image_url: imageUrl,
        }).select().single()
        return img ? (img as MemoryImage) : null
      } catch (err) {
        console.error('Image upload failed', err)
        return null
      }
    })

    const addedResults = await Promise.all(uploadPromises)
    const added = addedResults.filter((img): img is MemoryImage => img !== null)

    // Patch in store
    set(s => ({
      memories: s.memories.map(m =>
        m.id === memoryId ? { ...m, images: [...(m.images ?? []), ...added] } : m
      ),
    }))

    return added
  },

  removeImage: async (image) => {
    // Optimistic removal
    set(s => ({
      memories: s.memories.map(m =>
        m.id === image.memory_id
          ? { ...m, images: (m.images ?? []).filter(i => i.id !== image.id) }
          : m
      ),
    }))

    const { error } = await supabase.from('memory_images').delete().eq('id', image.id)
    if (error) return { error: error.message }

    // Cloudinary asset cleanup requires a signed server-side request;
    // the DB row is deleted so the image will no longer appear in the app.

    return { error: null }
  },

  setSelected: (memory) => set({ selectedMemory: memory }),
}))
