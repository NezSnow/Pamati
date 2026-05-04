import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronLeft, ChevronRight, ImageIcon, Sparkles, ArrowLeft, Trash2, AlertCircle, X } from 'lucide-react'
import { useGalleryStore, ALL_TAGS, type GalleryItem } from '../store/galleryStore'
import { cloudinaryUrl } from '../lib/cloudinary'
import Layout from '../components/Layout'
import PageTransition from '../components/PageTransition'

const PEOPLE_TAGS = ['Drew', 'Lengua', 'Shen', 'Paul']

function TagButton({ tag, active, onClick }: { tag: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300"
      style={active ? {
        background: 'var(--theme-gradient)',
        color: 'white',
        boxShadow: 'var(--theme-glow-shadow)',
      } : {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.5)',
      }}
    >
      {tag}
    </motion.button>
  )
}

function Lightbox({ item, items, onClose, onDelete }: {
  item: GalleryItem
  items: GalleryItem[]
  onClose: () => void
  onDelete: (id: string) => Promise<void>
}) {
  const [current, setCurrent] = useState(items.findIndex(i => i.id === item.id))
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const prev = () => { setCurrent(c => (c - 1 + items.length) % items.length); setConfirmDelete(false) }
  const next = () => { setCurrent(c => (c + 1) % items.length); setConfirmDelete(false) }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const currentItem = items[current]

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    await onDelete(currentItem.id)
    if (items.length <= 1) {
      onClose()
    } else {
      setCurrent(c => Math.min(c, items.length - 2))
      setConfirmDelete(false)
    }
    setDeleting(false)
  }

  const btnBase =
    'rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors'
  const btnStyle = { background: 'rgba(9,7,17,0.92)', border: '1px solid rgba(255,255,255,0.22)' } as const

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 backdrop-blur-2xl" />

      <div
        className="relative z-10 w-full max-h-full flex flex-col items-center justify-center px-3 py-6 sm:px-6 sm:py-10"
        onClick={e => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center w-full max-w-[min(92vw,1200px)]"
          >
            <div className="relative inline-block max-w-full">
              <img
                src={cloudinaryUrl(currentItem.image_url, 1600)}
                alt=""
                className="block max-h-[min(78vh,calc(100dvh-8rem))] w-auto max-w-full object-contain rounded-2xl"
                style={{ boxShadow: 'var(--theme-glow-shadow)' }}
                decoding="async"
              />

              {/* Toolbar anchored to the photo (not hidden under nav / screen edges) */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <button
                  type="button"
                  onClick={onClose}
                  className={`pointer-events-auto absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 ${btnBase} text-sm font-medium`}
                  style={btnStyle}
                  aria-label="Close"
                >
                  <ArrowLeft size={15} className="shrink-0" />
                  <span className="hidden sm:inline">Back</span>
                </button>

                <div className="pointer-events-auto absolute top-2 right-2 z-10 flex items-center gap-1.5 sm:gap-2">
                  <AnimatePresence>
                    {confirmDelete && (
                      <motion.button
                        key="cancel"
                        type="button"
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        onClick={() => setConfirmDelete(false)}
                        className={`px-2.5 py-1.5 sm:px-3 sm:py-2 ${btnBase} text-xs font-medium whitespace-nowrap`}
                        style={btnStyle}
                      >
                        Cancel
                      </motion.button>
                    )}
                  </AnimatePresence>
                  <motion.button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    title={confirmDelete ? 'Tap again to confirm' : 'Delete photo'}
                    className={`pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                      confirmDelete
                        ? 'bg-red-500/90 text-white'
                        : `${btnBase} hover:text-red-300`
                    }`}
                    style={!confirmDelete ? btnStyle : undefined}
                  >
                    <Trash2 size={15} className="shrink-0" />
                    {deleting
                      ? <span className="text-xs">Deleting…</span>
                      : confirmDelete
                        ? <span className="text-xs">Tap again</span>
                        : null}
                  </motion.button>
                </div>

                {items.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prev}
                      className={`pointer-events-auto absolute left-1.5 top-1/2 z-10 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 ${btnBase}`}
                      style={btnStyle}
                      aria-label="Previous photo"
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button
                      type="button"
                      onClick={next}
                      className={`pointer-events-auto absolute right-1.5 top-1/2 z-10 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 ${btnBase}`}
                      style={btnStyle}
                      aria-label="Next photo"
                    >
                      <ChevronRight size={22} />
                    </button>
                  </>
                )}

                <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 rounded-b-2xl bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pt-12 pb-2.5 sm:pt-14 sm:pb-3">
                  <p className="text-center text-white/90 text-xs font-medium tracking-widest tabular-nums">
                    {current + 1} / {items.length}
                  </p>
                </div>
              </div>
            </div>

            {currentItem.caption && (
              <p className="text-center text-white/50 text-sm mt-3 px-2">{currentItem.caption}</p>
            )}
            <div className="flex flex-wrap justify-center gap-2 mt-2 px-2">
              {currentItem.tags.map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full text-xs text-theme-accent"
                  style={{ background: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)' }}>{t}</span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>,
    document.body,
  )
}

function UploadModal({ onClose }: { onClose: () => void }) {
  const { upload } = useGalleryStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFile = (f: File) => {
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || submitting) return
    setSubmitting(true)
    setProgress(0)
    try {
      await upload(file, selectedTags, caption || undefined, setProgress)
      onClose()
    } finally {
      setSubmitting(false)
    }
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
        className="relative w-full max-w-md glass rounded-3xl p-7"
        style={{ border: '1px solid color-mix(in srgb, var(--theme-accent) 20%, transparent)' }}
      >
        <h2 className="text-xl font-bold gradient-text-static mb-5"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          Upload Photo
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className="w-full h-48 rounded-2xl border border-dashed border-theme-dashed flex items-center justify-center cursor-pointer overflow-hidden relative"
            onClick={() => fileRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-white/30">
                <ImageIcon size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Click to select image</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Who's in this photo?</p>
            <div className="flex flex-wrap gap-2">
              {PEOPLE_TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={selectedTags.includes(tag) ? {
                    background: 'var(--theme-gradient)',
                    color: 'white',
                  } : {
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)',
                  }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <input value={caption} onChange={e => setCaption(e.target.value)}
            placeholder="Add a caption (optional)..."
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm outline-none border-theme-focus" />

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={submitting}
              className="flex-1 py-3 rounded-xl glass-light text-white/50 hover:text-white text-sm transition-colors disabled:opacity-40">
              Cancel
            </button>
            <motion.button type="submit" disabled={submitting || !file}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 rounded-xl font-medium text-white text-sm disabled:opacity-50"
              style={{ background: 'var(--theme-gradient)' }}>
              {submitting ? 'Uploading...' : 'Upload'}
            </motion.button>
          </div>

          <AnimatePresence>
            {submitting && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="pt-2"
              >
                <div className="flex items-center justify-between text-xs text-white/50 mb-1.5">
                  <span>Upload progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'var(--theme-gradient)' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center text-white/40 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </motion.div>
    </motion.div>
  )
}

export default function GalleryPage() {
  const { fetch, activeTag, setActiveTag, setLightbox, lightboxImage, filteredItems, deleteItem, uploadError } = useGalleryStore()
  const [showUpload, setShowUpload] = useState(false)
  const displayed = filteredItems()

  useEffect(() => { fetch() }, [])

  return (
    <Layout>
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          {/* Upload error toast */}
          <AnimatePresence>
            {uploadError && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl text-sm text-white shadow-xl"
                style={{ background: 'rgba(220,38,38,0.92)', backdropFilter: 'blur(12px)', maxWidth: '90vw' }}
              >
                <AlertCircle size={16} className="shrink-0" />
                <span>{uploadError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest mb-2 opacity-60 text-theme-accent-2">
                <Sparkles size={11} />
                Photo Gallery
              </div>
              <h1 className="text-4xl font-bold gradient-text"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                Our Moments
              </h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: 'var(--theme-glow-shadow)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white text-sm"
              style={{ background: 'var(--theme-gradient)' }}
            >
              <Plus size={16} /> Add Photo
            </motion.button>
          </div>

          {/* Tag Filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            {ALL_TAGS.map(tag => (
              <TagButton key={tag} tag={tag} active={activeTag === tag} onClick={() => setActiveTag(tag)} />
            ))}
          </div>

          {/* Masonry Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTag}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
            >
              {displayed.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={i < 12 ? { opacity: 0, y: 20 } : false}
                  animate={i < 12 ? { opacity: 1, y: 0 } : undefined}
                  transition={{ delay: i < 12 ? i * 0.04 : 0, duration: 0.4 }}
                  className="break-inside-avoid group cursor-pointer relative rounded-2xl overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                  onClick={() => setLightbox(item)}
                  whileHover={{ scale: 1.02 }}
                >
                  <img
                    src={cloudinaryUrl(item.image_url, 600)}
                    alt={item.caption ?? ''}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end">
                    <div className="p-3 w-full translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      {item.caption && <p className="text-white text-xs mb-1">{item.caption}</p>}
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded-full text-[10px] text-theme-accent"
                            style={{ background: 'color-mix(in srgb, var(--theme-accent) 20%, transparent)' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {displayed.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-32"
            >
              <ImageIcon size={48} className="mx-auto mb-4 text-white/10" />
              <p className="text-white/30">No photos yet for this filter</p>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {lightboxImage && (
            <Lightbox
              item={lightboxImage}
              items={displayed}
              onClose={() => setLightbox(null)}
              onDelete={async (id) => { await deleteItem(id); if (displayed.length <= 1) setLightbox(null) }}
            />
          )}
          {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
        </AnimatePresence>
      </PageTransition>
    </Layout>
  )
}
