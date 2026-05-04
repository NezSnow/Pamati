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
  fetch: () => Promise<void>
  create: (data: Omit<Memory, 'id' | 'created_at' | 'images'>, images: File[]) => Promise<void>
  updateMemory: (id: string, fields: { title?: string; description?: string; date?: string }) => Promise<{ error: string | null }>
  addImages: (memoryId: string, files: File[]) => Promise<MemoryImage[]>
  removeImage: (image: MemoryImage) => Promise<{ error: string | null }>
  setSelected: (memory: Memory | null) => void
}

export const useMemoriesStore = create<MemoriesState>((set, get) => ({
  memories: [],
  loading: false,
  selectedMemory: null,

  fetch: async () => {
    set({ loading: true })
    const { data: memories } = await supabase
      .from('memories')
      .select('*')
      .order('date', { ascending: false })

    if (memories) {
      const memoriesWithImages = await Promise.all(
        memories.map(async (m) => {
          const { data: imgs } = await supabase
            .from('memory_images')
            .select('*')
            .eq('memory_id', m.id)
          return { ...m, images: imgs || [] }
        })
      )
      set({ memories: memoriesWithImages as Memory[] })
    }
    set({ loading: false })
  },

  create: async (data, imageFiles) => {
    const { data: memory, error } = await supabase
      .from('memories')
      .insert(data)
      .select()
      .single()

    if (error || !memory) return

    const newImages: MemoryImage[] = []
    for (const file of imageFiles) {
      const imageUrl = await uploadToCloudinary(file)
      const { data: img } = await supabase.from('memory_images').insert({
        memory_id: memory.id,
        image_url: imageUrl,
      }).select().single()
      if (img) newImages.push(img as MemoryImage)
    }

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
      await get().fetch()
      return { error: error.message }
    }
    return { error: null }
  },

  addImages: async (memoryId, files) => {
    const added: MemoryImage[] = []
    for (const file of files) {
      const imageUrl = await uploadToCloudinary(file)
      const { data: img } = await supabase.from('memory_images').insert({
        memory_id: memoryId,
        image_url: imageUrl,
      }).select().single()
      if (img) added.push(img as MemoryImage)
    }

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
