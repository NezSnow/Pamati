import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ChevronLeft, ChevronRight, Calendar, Upload, Sparkles, Pencil, Check, Loader2, ImagePlus, Trash2 } from 'lucide-react'
import { useMemoriesStore, type Memory, type MemoryImage } from '../store/memoriesStore'
import { useAuthStore } from '../store/authStore'
import Layout from '../components/Layout'
import PageTransition from '../components/PageTransition'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

function MemoryCard({ memory, index, onClick }: { memory: Memory; index: number; onClick: () => void }) {
  const sizes = [
    'md:col-span-2 h-72',
    'md:col-span-1 h-72',
    'md:col-span-1 h-64',
    'md:col-span-2 h-64',
    'md:col-span-1 h-80',
    'md:col-span-1 h-80',
    'md:col-span-2 h-68',
  ]
  const sizeClass = sizes[index % sizes.length]
  const img = memory.images?.[0]?.image_url

  return (
    <motion.div
      variants={cardVariant}
      className={`${sizeClass} relative rounded-2xl overflow-hidden cursor-pointer group`}
      style={{ border: '1px solid color-mix(in srgb, var(--theme-accent) 10%, transparent)' }}
      onClick={onClick}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {img ? (
        <img
          src={img}
          alt={memory.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-accent) 10%, transparent), color-mix(in srgb, var(--theme-accent-2) 10%, transparent))' }} />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 transition-opacity duration-300"
        style={{ background: 'linear-gradient(to top, rgba(5,5,8,0.95) 0%, rgba(5,5,8,0.3) 50%, transparent 100%)' }} />

      {/* Hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-accent) 8%, transparent), color-mix(in srgb, var(--theme-accent-2) 8%, transparent))' }} />

      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-center gap-2 text-xs mb-2 opacity-70 text-theme-accent">
          <Calendar size={11} />
          {new Date(memory.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <h3 className="text-white font-bold text-lg leading-tight transition-colors group-hover:opacity-90">
          {memory.title}
        </h3>
        {memory.images && memory.images.length > 1 && (
          <div className="mt-2 text-white/40 text-xs">{memory.images.length} photos</div>
        )}
      </div>

      {/* Image count badge */}
      {memory.images && memory.images.length > 0 && (
        <div className="absolute top-3 right-3 px-2 py-1 rounded-lg text-xs text-white/60 backdrop-blur-sm"
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          {memory.images.length} ✦
        </div>
      )}
    </motion.div>
  )
}

function MemoryModal({ memory, onClose }: { memory: Memory; onClose: () => void }) {
  const { updateMemory, addImages, removeImage, memories } = useMemoriesStore()

  // Always read latest version of this memory from the store (images may update)
  const live = memories.find(m => m.id === memory.id) ?? memory

  const [editMode, setEditMode] = useState(false)
  const [currentImg, setCurrentImg] = useState(0)

  // Edit-mode state
  const [editTitle, setEditTitle] = useState(live.title)
  const [editDate, setEditDate] = useState(live.date)
  const [editDesc, setEditDesc] = useState(live.description)
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const addFileRef = useRef<HTMLInputElement>(null)

  const images: MemoryImage[] = live.images ?? []

  // Keep carousel index in bounds when images change
  if (currentImg >= images.length && images.length > 0) setCurrentImg(images.length - 1)

  const enterEdit = () => {
    setEditTitle(live.title)
    setEditDate(live.date)
    setEditDesc(live.description)
    setNewFiles([])
    setEditMode(true)
  }

  const cancelEdit = () => {
    setNewFiles([])
    setEditMode(false)
  }

  const handleSave = async () => {
    setSaving(true)

    // 1. Save metadata
    await updateMemory(live.id, { title: editTitle.trim(), description: editDesc.trim(), date: editDate })

    // 2. Upload any new photos
    if (newFiles.length > 0) {
      setUploading(true)
      await addImages(live.id, newFiles)
      setUploading(false)
    }

    setNewFiles([])
    setSaving(false)
    setEditMode(false)
  }

  const handleRemoveImage = async (img: MemoryImage) => {
    setRemovingId(img.id)
    await removeImage(img)
    setRemovingId(null)
  }

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? [])
    setNewFiles(prev => [...prev, ...picked])
    e.target.value = ''
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={!editMode ? onClose : undefined}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-3xl glass rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: 'var(--theme-glow-shadow)',
        }}
      >
        {/* ── VIEW MODE ───────────────────────────────────────── */}
        {!editMode && (
          <>
            {images.length > 0 && (
              <div className="relative h-72 bg-black/50 overflow-hidden flex-shrink-0">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImg}
                    src={images[currentImg].image_url}
                    alt=""
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(5,5,8,0.85))' }} />

                {images.length > 1 && (
                  <>
                    <button onClick={() => setCurrentImg(i => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass flex items-center justify-center text-white/70 hover:text-white transition-colors">
                      <ChevronLeft size={18} />
                    </button>
                    <button onClick={() => setCurrentImg(i => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass flex items-center justify-center text-white/70 hover:text-white transition-colors">
                      <ChevronRight size={18} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <button key={i} onClick={() => setCurrentImg(i)}
                          className={`h-1.5 rounded-full transition-all ${i === currentImg ? 'w-4 bg-[var(--theme-accent)]' : 'w-1.5 bg-white/30'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="p-6 overflow-y-auto">
              <div className="flex items-center gap-2 text-theme-accent text-xs mb-3">
                <Calendar size={12} />
                {new Date(live.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <h2 className="text-2xl font-bold gradient-text-static mb-3"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                {live.title}
              </h2>
              <p className="text-white/60 leading-relaxed">{live.description}</p>

              {images.length > 1 && (
                <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <button key={img.id} onClick={() => setCurrentImg(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                        i === currentImg ? 'border-[var(--theme-accent)]' : 'border-transparent opacity-50'
                      }`}>
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── EDIT MODE ───────────────────────────────────────── */}
        {editMode && (
          <div className="overflow-y-auto p-6 space-y-5">
            <p className="text-white/50 text-xs uppercase tracking-widest font-medium">Editing Ganap</p>

            {/* Title */}
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1.5">Title</label>
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm outline-none"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1.5">Date</label>
              <input
                type="date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none [color-scheme:dark]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1.5">Story</label>
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm outline-none resize-none"
              />
            </div>

            {/* Existing photos */}
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-2">Photos ({images.length})</label>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {images.map(img => (
                  <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveImage(img)}
                      disabled={removingId === img.id}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(0,0,0,0.65)' }}
                    >
                      {removingId === img.id
                        ? <Loader2 size={16} className="text-white animate-spin" />
                        : <Trash2 size={15} className="text-red-400" />
                      }
                    </motion.button>
                  </div>
                ))}

                {/* New file previews */}
                {newFiles.map((f, i) => (
                  <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden opacity-70"
                    style={{ border: '1px dashed rgba(255,255,255,0.20)' }}>
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white/80 hover:text-white"
                    >
                      <X size={10} />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 text-center text-white/50 text-[9px] pb-0.5 bg-black/40">new</div>
                  </div>
                ))}

                {/* Add more button */}
                <button
                  type="button"
                  onClick={() => addFileRef.current?.click()}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px dashed rgba(255,255,255,0.18)',
                    color: 'rgba(255,255,255,0.35)',
                  }}
                >
                  <ImagePlus size={18} />
                  <span className="text-[10px]">Add</span>
                </button>
                <input ref={addFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddFiles} />
              </div>
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={cancelEdit}
                className="flex-1 py-2.5 rounded-xl text-sm text-white/50 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Cancel
              </button>
              <motion.button
                type="button"
                onClick={handleSave}
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'var(--theme-gradient)' }}
              >
                {saving
                  ? <><Loader2 size={13} className="animate-spin" />{uploading ? 'Uploading…' : 'Saving…'}</>
                  : <><Check size={13} />Save Changes</>
                }
              </motion.button>
            </div>
          </div>
        )}

        {/* Top-right buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
          {!editMode && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={enterEdit}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
              title="Edit ganap"
            >
              <Pencil size={13} />
            </motion.button>
          )}
          <button
            onClick={editMode ? cancelEdit : onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function AddMemoryModal({ onClose }: { onClose: () => void }) {
  const { create } = useMemoriesStore()
  const { user } = useAuthStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)
    await create({ title, description, date, created_by: user.id }, files)
    setSubmitting(false)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg glass rounded-3xl p-7"
        style={{ border: '1px solid color-mix(in srgb, var(--theme-accent) 20%, transparent)' }}
      >
        <h2 className="text-xl font-bold gradient-text-static mb-5"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          Add a Memory
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={title} onChange={e => setTitle(e.target.value)} required
            placeholder="Memory title..."
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm outline-none border-theme-focus" />

          <input type="date" value={date} onChange={e => setDate(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none border-theme-focus [color-scheme:dark]" />

          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            placeholder="Tell the story..."
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm outline-none resize-none border-theme-focus" />

          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full py-3 rounded-xl border border-dashed border-theme-dashed text-white/40 transition-all text-sm flex items-center justify-center gap-2 hover:text-theme-accent hover:border-[color:color-mix(in_srgb,var(--theme-accent)_50%,transparent)]">
            <Upload size={14} />
            {files.length > 0 ? `${files.length} photo(s) selected` : 'Upload photos'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => setFiles(Array.from(e.target.files ?? []))} />

          {files.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {files.map((f, i) => (
                <img key={i} src={URL.createObjectURL(f)} alt=""
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-white/10" />
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl glass-light text-white/50 hover:text-white text-sm transition-colors">
              Cancel
            </button>
            <motion.button type="submit" disabled={submitting}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 rounded-xl font-medium text-white text-sm"
              style={{ background: 'var(--theme-gradient)' }}>
              {submitting ? 'Saving...' : 'Save Memory'}
            </motion.button>
          </div>
        </form>

        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center text-white/40 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </motion.div>
    </motion.div>
  )
}

export default function MemoriesPage() {
  const { memories, loading, fetch } = useMemoriesStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  // Derive the selected memory from the live store so edits reflect immediately
  const selected = selectedId ? (memories.find(m => m.id === selectedId) ?? null) : null

  useEffect(() => { fetch() }, [])

  return (
    <Layout>
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          {/* Header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest mb-2 opacity-60 text-theme-accent">
                <Sparkles size={11} />
                Memory Vault
              </div>
              <h1 className="text-4xl font-bold gradient-text"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                Our Ganaps
              </h1>
              <p className="text-white/30 text-sm mt-1">{memories.length} shared moments</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: 'var(--theme-glow-shadow)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white text-sm"
              style={{ background: 'var(--theme-gradient)' }}
            >
              <Plus size={16} /> Add Memory
            </motion.button>
          </div>

          {/* Bento Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`${i % 3 === 0 ? 'md:col-span-2' : ''} h-64 rounded-2xl animate-pulse`}
                  style={{ background: 'rgba(255,255,255,0.03)' }} />
              ))}
            </div>
          ) : memories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-32"
            >
              <div className="text-6xl mb-4">✦</div>
              <p className="text-white/30">No memories yet. Add your first ganap!</p>
            </motion.div>
          ) : (
            <motion.div
              variants={container} initial="hidden" animate="show"
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {memories.map((memory, i) => (
                <MemoryCard key={memory.id} memory={memory} index={i} onClick={() => setSelectedId(memory.id)} />
              ))}
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {selected && <MemoryModal memory={selected} onClose={() => setSelectedId(null)} />}
          {showAdd && <AddMemoryModal onClose={() => setShowAdd(false)} />}
        </AnimatePresence>
      </PageTransition>
    </Layout>
  )
}
