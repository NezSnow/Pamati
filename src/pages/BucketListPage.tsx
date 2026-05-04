import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, MapPin, X, Sparkles, Trophy, Star, Calendar, Clock, Loader2, Pencil } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useBucketStore, type BucketItem } from '../store/bucketStore'
import { useAuthStore } from '../store/authStore'
import { getParticlePalette, type ThemeKey } from '../lib/fruitTheme'
import Layout from '../components/Layout'
import PageTransition from '../components/PageTransition'

function triggerConfetti(themeKey: ThemeKey) {
  const end = Date.now() + 2000
  const colors = [...getParticlePalette(themeKey), '#ffffff']

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    })
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

function ProgressBar({ items }: { items: BucketItem[] }) {
  const completed = items.filter(i => i.status === 'completed').length
  const total = items.length
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 mb-8"
      style={{ border: '1px solid color-mix(in srgb, var(--theme-accent-2) 15%, transparent)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-theme-accent-2" />
          <span className="text-white/60 text-sm font-medium">Adventure Progress</span>
        </div>
        <span className="text-white font-bold gradient-text-static">{pct}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: 0.3 }}
          className="h-full rounded-full"
          style={{ background: 'var(--theme-gradient)' }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-white/30">
        <span>{completed} completed</span>
        <span>{total - completed} remaining</span>
      </div>
    </motion.div>
  )
}

function BucketDetailModal({
  itemId,
  onClose,
  onComplete,
}: {
  itemId: string
  onClose: () => void
  onComplete: (id: string) => void
}) {
  const item = useBucketStore(s => s.items.find(i => i.id === itemId))
  const { updateItem } = useBucketStore()

  const [editMode, setEditMode] = useState(false)
  const [marking, setMarking] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit fields
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editDate, setEditDate] = useState('')

  const enterEdit = () => {
    if (!item) return
    setEditTitle(item.title)
    setEditDesc(item.description ?? '')
    setEditDate(item.planned_date ?? '')
    setEditMode(true)
  }

  const cancelEdit = () => setEditMode(false)

  const handleSave = async () => {
    if (!item || !editTitle.trim()) return
    setSaving(true)
    await updateItem(item.id, {
      title: editTitle.trim(),
      description: editDesc.trim() || undefined,
      planned_date: editDate || null,
    })
    setSaving(false)
    setEditMode(false)
  }

  const handleMarkDone = () => {
    if (!item) return
    setMarking(true)
    onComplete(item.id)
    setTimeout(() => setMarking(false), 600)
  }

  if (!item) return null

  const isCompleted = item.status === 'completed'
  const addedDate = new Date(item.created_at)
  const completedDate = item.completed_at ? new Date(item.completed_at) : null
  const plannedDate = item.planned_date ? new Date(item.planned_date + 'T00:00:00') : null
  const daysToComplete = completedDate
    ? Math.round((completedDate.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24))
    : null

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={!editMode ? onClose : undefined}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          background: '#0d0a1a',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: 'var(--theme-glow-shadow)',
        }}
      >
        {/* Header band */}
        <div
          className="h-24 relative overflow-hidden flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--theme-gradient)' }}
        >
          <div className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(255,255,255,0.22) 0%, transparent 70%)' }} />
          <motion.div
            key={isCompleted ? 'done' : 'plan'}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.08 }}
            className="w-14 h-14 rounded-2xl flex items-center justify-center relative z-10"
            style={{ background: 'rgba(0,0,0,0.25)' }}
          >
            {isCompleted ? <Trophy size={26} className="text-white" /> : <MapPin size={26} className="text-white" />}
          </motion.div>
        </div>

        {/* ── VIEW MODE ─────────────────────────────────────── */}
        {!editMode && (
          <div className="p-6 overflow-y-auto">
            {/* Status badge */}
            <div className="mb-3">
              <AnimatePresence mode="wait">
                {isCompleted ? (
                  <motion.div key="c" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-emerald-300"
                    style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)' }}>
                    <Check size={11} /> Adventure Completed
                  </motion.div>
                ) : (
                  <motion.div key="p" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                    style={{ color: 'var(--theme-accent)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                    <Clock size={11} /> Planned
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 leading-snug"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              {item.title}
            </h2>

            {item.description
              ? <p className="text-white/55 text-sm leading-relaxed mb-5">{item.description}</p>
              : <p className="text-white/20 text-sm italic mb-5">No description yet.</p>
            }

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-1.5 text-xs mb-1 opacity-70 text-theme-accent-2">
                  <Calendar size={11} /> Added
                </div>
                <p className="text-white text-sm font-medium">
                  {addedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {!isCompleted && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-1.5 text-xs mb-1 opacity-70 text-theme-accent">
                    <Calendar size={11} /> Target Date
                  </div>
                  <p className="text-white text-sm font-medium">
                    {plannedDate
                      ? plannedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : <span className="text-white/30 italic text-xs">Not set</span>
                    }
                  </p>
                </div>
              )}

              {isCompleted && (
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-1.5 text-xs mb-1 opacity-70 text-theme-accent">
                    <Star size={11} fill="currentColor" /> Completed
                  </div>
                  <p className="text-white text-sm font-medium">
                    {completedDate
                      ? completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </p>
                </div>
              )}
            </div>

            {/* Days banner */}
            {isCompleted && daysToComplete !== null && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Clock size={14} className="opacity-60 text-theme-accent-2" />
                <span className="text-white/50 text-sm">
                  {daysToComplete === 0
                    ? 'Completed the same day it was added ✦'
                    : `Took ${daysToComplete} day${daysToComplete !== 1 ? 's' : ''} to accomplish ✦`}
                </span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm text-white/50 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Close
              </button>
              {!isCompleted && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleMarkDone} disabled={marking}
                  className="flex-1 py-2.5 rounded-xl font-medium text-white text-sm flex items-center justify-center gap-2 disabled:opacity-70"
                  style={{ background: 'var(--theme-gradient)' }}>
                  {marking
                    ? <><Loader2 size={13} className="animate-spin" />Marking…</>
                    : <><Check size={13} />Mark as Done</>
                  }
                </motion.button>
              )}
            </div>
          </div>
        )}

        {/* ── EDIT MODE ─────────────────────────────────────── */}
        {editMode && (
          <div className="p-6 overflow-y-auto space-y-4">
            <p className="text-white/40 text-xs uppercase tracking-widest font-medium">Edit Adventure</p>

            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1.5">Title</label>
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Adventure title…"
                className="w-full px-4 py-2.5 rounded-xl text-white placeholder-white/20 text-sm outline-none"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1.5">Description</label>
              <textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                rows={3}
                placeholder="Tell us more about it…"
                className="w-full px-4 py-2.5 rounded-xl text-white placeholder-white/20 text-sm outline-none resize-none"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1.5">
                Target Date <span className="normal-case opacity-60">(when do you plan to do it?)</span>
              </label>
              <input
                type="date"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none [color-scheme:dark]"
                style={inputStyle}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={cancelEdit}
                className="flex-1 py-2.5 rounded-xl text-sm text-white/50 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSave} disabled={saving || !editTitle.trim()}
                className="flex-1 py-2.5 rounded-xl font-medium text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: 'var(--theme-gradient)' }}>
                {saving
                  ? <><Loader2 size={13} className="animate-spin" />Saving…</>
                  : <><Check size={13} />Save Changes</>
                }
              </motion.button>
            </div>
          </div>
        )}

        {/* Top-right buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
          {!editMode && !isCompleted && (
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={enterEdit}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.7)' }}
              title="Edit"
            >
              <Pencil size={13} />
            </motion.button>
          )}
          {!editMode && isCompleted && (
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={enterEdit}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.7)' }}
              title="Edit"
            >
              <Pencil size={13} />
            </motion.button>
          )}
          <button
            onClick={editMode ? cancelEdit : onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors"
            style={{ background: 'rgba(0,0,0,0.30)' }}>
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function BucketCard({ item, onOpen }: { item: BucketItem; onOpen: (id: string) => void }) {
  const isCompleted = item.status === 'completed'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      whileHover={{ y: -3 }}
      onClick={() => onOpen(item.id)}
      className="glass rounded-2xl p-5 flex items-start gap-4 group cursor-pointer"
      style={{
        border: isCompleted
          ? '1px solid rgba(255,255,255,0.10)'
          : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isCompleted ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'var(--theme-gradient)' }}
          >
            <Check size={13} className="text-white" />
          </motion.div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-white/15 flex items-center justify-center transition-colors group-hover:border-[var(--theme-accent)]/40">
            <div className="w-2 h-2 rounded-full opacity-0 group-hover:opacity-40 bg-[var(--theme-accent)] transition-opacity" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold mb-1 transition-colors ${isCompleted ? 'text-white/50 line-through' : 'text-white'}`}>
          {item.title}
        </h3>
        {item.description && (
          <p className={`text-sm leading-relaxed ${isCompleted ? 'text-white/20' : 'text-white/50'}`}>
            {item.description}
          </p>
        )}
        {isCompleted && item.completed_at && (
          <p className="text-xs mt-2 opacity-60 text-theme-accent-2">
            Completed {new Date(item.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ✦
          </p>
        )}
      </div>

      <div className="flex-shrink-0 flex items-center gap-1 opacity-30 group-hover:opacity-60 transition-opacity text-xs text-white/60">
        {isCompleted
          ? <><Star size={11} fill="currentColor" className="text-theme-accent-2" /><span className="hidden sm:inline text-theme-accent-2">Review</span></>
          : <><MapPin size={11} /><span className="hidden sm:inline">Open</span></>
        }
      </div>
    </motion.div>
  )
}

function AddModal({ onClose }: { onClose: () => void }) {
  const { add } = useBucketStore()
  const { user } = useAuthStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title.trim()) return
    setSubmitting(true)
    // Close immediately — optimistic update shows item instantly
    add({ title, description, created_by: user.id })
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
        className="relative w-full max-w-md glass rounded-3xl p-7"
        style={{ border: '1px solid color-mix(in srgb, var(--theme-accent) 20%, transparent)' }}
      >
        <h2 className="text-xl font-bold gradient-text-static mb-5"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          Add Adventure
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 text-theme-accent" />
            <input value={title} onChange={e => setTitle(e.target.value)} required
              placeholder="Where do you want to go?"
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm outline-none border-theme-focus" />
          </div>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            placeholder="Tell us more about it..."
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm outline-none resize-none border-theme-focus" />
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl glass-light text-white/50 hover:text-white text-sm transition-colors">
              Cancel
            </button>
            <motion.button type="submit" disabled={submitting}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 rounded-xl font-medium text-white text-sm"
              style={{ background: 'var(--theme-gradient)' }}>
              {submitting ? 'Adding...' : 'Add to List'}
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

export default function BucketListPage() {
  const { items, loading, fetch, complete, lastCompleted, clearLastCompleted } = useBucketStore()
  const fruitTheme = useAuthStore((s) => s.fruitTheme)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const celebRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetch() }, [])

  useEffect(() => {
    if (lastCompleted) {
      triggerConfetti(fruitTheme ?? 'strawberry')
      const t = setTimeout(clearLastCompleted, 4000)
      return () => clearTimeout(t)
    }
  }, [lastCompleted, fruitTheme])

  const planned = items.filter(i => i.status === 'planned')
  const completed = items.filter(i => i.status === 'completed')

  return (
    <Layout>
      <PageTransition>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12" ref={celebRef}>
          {/* Header */}
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest mb-2 opacity-60 text-theme-accent">
                <Sparkles size={11} />
                Bucket List
              </div>
              <h1 className="text-4xl font-bold gradient-text"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                Our Adventures
              </h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: 'var(--theme-glow-shadow)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white text-sm"
              style={{ background: 'var(--theme-gradient)' }}
            >
              <Plus size={16} /> Add
            </motion.button>
          </div>

          {/* Celebration toast */}
          <AnimatePresence>
            {lastCompleted && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-2xl text-white text-sm font-medium flex items-center gap-2"
                style={{
                  background: 'var(--theme-gradient)',
                  boxShadow: 'var(--theme-glow-shadow)',
                }}
              >
                <Trophy size={16} />
                "{lastCompleted}" completed! 🎉
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress */}
          {items.length > 0 && <ProgressBar items={items} />}

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
              ))}
            </div>
          ) : (
            <>
              {/* Planned */}
              {planned.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-white/40 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapPin size={11} /> Planned ({planned.length})
                  </h2>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {planned.map(item => (
                        <BucketCard key={item.id} item={item} onOpen={setSelectedId} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Completed */}
              {completed.length > 0 && (
                <div>
                  <h2 className="text-white/40 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Check size={11} /> Completed ({completed.length})
                  </h2>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {completed.map(item => (
                        <BucketCard key={item.id} item={item} onOpen={setSelectedId} />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {items.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center py-32"
                >
                  <div className="text-6xl mb-4">🗺️</div>
                  <p className="text-white/30">No adventures yet. Add something to your list!</p>
                </motion.div>
              )}
            </>
          )}
        </div>

        <AnimatePresence>
          {showAdd && <AddModal onClose={() => setShowAdd(false)} />}
          {selectedId && (
            <BucketDetailModal
              itemId={selectedId}
              onClose={() => setSelectedId(null)}
              onComplete={id => { complete(id); triggerConfetti(fruitTheme ?? 'strawberry') }}
            />
          )}
        </AnimatePresence>
      </PageTransition>
    </Layout>
  )
}
