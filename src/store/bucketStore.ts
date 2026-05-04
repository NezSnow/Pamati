import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface BucketItem {
  id: string
  title: string
  description: string | null
  status: 'planned' | 'completed'
  created_by: string
  created_at: string
  completed_at: string | null
  planned_date: string | null   // target date for the adventure
}

interface BucketState {
  items: BucketItem[]
  loading: boolean
  lastCompleted: string | null
  fetch: () => Promise<void>
  add: (data: { title: string; description?: string; created_by: string }) => Promise<void>
  updateItem: (id: string, fields: { title?: string; description?: string | null; planned_date?: string | null }) => Promise<{ error: string | null }>
  complete: (id: string) => Promise<void>
  clearLastCompleted: () => void
}

export const useBucketStore = create<BucketState>((set, get) => ({
  items: [],
  loading: false,
  lastCompleted: null,

  fetch: async () => {
    set({ loading: true })
    const { data } = await supabase
      .from('bucket_list')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) set({ items: data as BucketItem[] })
    set({ loading: false })
  },

  add: async ({ title, description, created_by }) => {
    const tempId = `temp-${Date.now()}`
    const tempItem: BucketItem = {
      id: tempId,
      title,
      description: description || null,
      status: 'planned',
      created_by,
      created_at: new Date().toISOString(),
      completed_at: null,
      planned_date: null,
    }
    set(state => ({ items: [tempItem, ...state.items] }))

    const { data } = await supabase.from('bucket_list').insert({
      title,
      description: description || null,
      status: 'planned',
      created_by,
    }).select().single()

    if (data) {
      set(state => ({
        items: state.items.map(i => i.id === tempId ? (data as BucketItem) : i),
      }))
    } else {
      await get().fetch()
    }
  },

  updateItem: async (id, fields: { title?: string; description?: string | null; planned_date?: string | null }) => {
    // Optimistic update
    set(state => ({
      items: state.items.map(i => i.id === id ? { ...i, ...fields } : i),
    }))

    const { error } = await supabase
      .from('bucket_list')
      .update(fields)
      .eq('id', id)

    if (error) {
      await get().fetch()
      return { error: error.message }
    }
    return { error: null }
  },

  complete: async (id) => {
    const completedAt = new Date().toISOString()
    const item = get().items.find(i => i.id === id)

    set(state => ({
      items: state.items.map(i =>
        i.id === id ? { ...i, status: 'completed', completed_at: completedAt } : i
      ),
      lastCompleted: item?.title ?? null,
    }))

    await supabase
      .from('bucket_list')
      .update({ status: 'completed', completed_at: completedAt })
      .eq('id', id)
  },

  clearLastCompleted: () => set({ lastCompleted: null }),
}))
