import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, Image, MapPin, Sparkles, Settings } from 'lucide-react'
import { useMemoriesStore } from '../store/memoriesStore'
import { useGalleryStore } from '../store/galleryStore'
import { cloudinaryUrl } from '../lib/cloudinary'
import { useBucketStore } from '../store/bucketStore'
import { useAuthStore } from '../store/authStore'
import Layout from '../components/Layout'
import PageTransition from '../components/PageTransition'
import ProfileModal from '../components/ProfileModal'

const STORY_DURATION = 4000 // ms per slide

function StoryCard({ items }: { items: { image_url: string; caption: string | null }[] }) {
  const [current, setCurrent] = useState(0)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const total = items.length

  const goTo = useCallback((index: number) => {
    setCurrent(index)
    setProgress(0)
  }, [])

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % total)
    setProgress(0)
  }, [total])

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + total) % total)
    setProgress(0)
  }, [total])

  useEffect(() => {
    if (total === 0) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (progressRef.current) clearInterval(progressRef.current)

    setProgress(0)

    const step = 100 / (STORY_DURATION / 50)
    progressRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) return 100
        return p + step
      })
    }, 50)

    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % total)
      setProgress(0)
    }, STORY_DURATION)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [current, total])

  if (total === 0) return (
    <div className="glass rounded-3xl overflow-hidden h-80 relative flex items-center justify-center"
      style={{ border: '1px solid color-mix(in srgb, var(--theme-accent-2) 12%, transparent)' }}>
      <Image size={40} className="opacity-30 text-theme-accent-2" />
    </div>
  )

  return (
    <Link to="/gallery" className="block group">
      <motion.div
        whileHover={{ y: -4, boxShadow: 'var(--theme-glow-shadow)' }}
        className="glass rounded-3xl overflow-hidden h-80 relative cursor-pointer"
        style={{ border: '1px solid color-mix(in srgb, var(--theme-accent-2) 12%, transparent)' }}
      >
        {/* Story progress bars */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
          {items.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.2)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'var(--theme-gradient)',
                  width: i < current ? '100%' : i === current ? `${progress}%` : '0%',
                }}
                transition={{ ease: 'linear' }}
              />
            </div>
          ))}
        </div>

        {/* Image */}
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={cloudinaryUrl(items[current].image_url, 800)}
            alt=""
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 w-full h-full object-cover"
            onError={next}
            decoding="async"
          />
        </AnimatePresence>

        {/* Gradient overlay */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(5,5,8,0.85) 0%, transparent 50%)' }} />

        {/* Tap zones */}
        <button
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
          onClick={e => { e.preventDefault(); prev() }}
          aria-label="Previous"
        />
        <button
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
          onClick={e => { e.preventDefault(); next() }}
          aria-label="Next"
        />

        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <div className="text-xs text-theme-accent-2 mb-1">From the Gallery</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-white/60 text-sm"
            >
              {items[current].caption ?? 'Random snapshot'}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-3 right-4 z-10 flex gap-1 items-center">
          {items.map((_, i) => (
            <div key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? '16px' : '4px',
                height: '4px',
                background: i === current ? 'var(--theme-accent)' : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>

        <div className="absolute top-7 left-4 px-3 py-1 rounded-full text-xs z-10 text-theme-accent-2"
          style={{ background: 'color-mix(in srgb, var(--theme-accent-2) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-accent-2) 20%, transparent)' }}>
          {current + 1} / {total}
        </div>
      </motion.div>
    </Link>
  )
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export default function HomePage() {
  const { memories, fetch: fetchMemories } = useMemoriesStore()
  const { items: gallery, fetch: fetchGallery } = useGalleryStore()
  const { items: bucket, fetch: fetchBucket } = useBucketStore()
  const { profile } = useAuthStore()
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    fetchMemories()
    fetchGallery()
    fetchBucket()
  }, [])

  const latestMemory = memories[0]
  const upcomingPlan = bucket.find(b => b.status === 'planned')
  const validGallery = gallery.filter(i => i.image_url && !i.image_url.startsWith('blob:'))

  return (
    <Layout>
      <PageTransition>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          {/* Hero */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="text-center mb-16"
          >
            <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs uppercase tracking-widest text-theme-accent"
              style={{ background: 'color-mix(in srgb, var(--theme-accent) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-accent) 15%, transparent)' }}>
              <Sparkles size={12} />
              Welcome back, {profile?.name ?? 'friend'}
            </motion.div>

            <motion.h1
              variants={item}
              className="text-5xl md:text-7xl font-bold mb-4 leading-[1.1]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              <span className="gradient-text">Our Memories,</span>
              <br />
              <span className="text-white/90">Our Story</span>
            </motion.h1>

            <motion.p variants={item} className="text-white/40 text-lg max-w-lg mx-auto mb-8">
              A private digital vault for the four of us — every laugh, every place, every moment.
            </motion.p>

            <motion.div variants={item} className="flex items-center justify-center gap-3">
              <Link to="/memories">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: 'var(--theme-glow-shadow)' }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white text-sm"
                  style={{ background: 'var(--theme-gradient)' }}
                >
                  View Memories <ArrowRight size={15} />
                </motion.button>
              </Link>
              <Link to="/gallery">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  className="glass-light flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white/70 text-sm hover:text-white transition-colors"
                >
                  Gallery <Image size={15} />
                </motion.button>
              </Link>
              {profile && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setProfileOpen(true)}
                  className="glass-light flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white/70 text-sm hover:text-white transition-colors"
                >
                  Edit Profile <Settings size={15} />
                </motion.button>
              )}
            </motion.div>
          </motion.div>

          {/* Bento Grid */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Recent Memory — large card */}
            <motion.div variants={item} className="md:col-span-2">
              <Link to="/memories" className="block group">
                <motion.div
                  whileHover={{ y: -4, boxShadow: 'var(--theme-glow-shadow)' }}
                  className="glass rounded-3xl overflow-hidden h-80 relative cursor-pointer"
                  style={{ border: '1px solid color-mix(in srgb, var(--theme-accent) 12%, transparent)' }}
                >
                  {latestMemory?.images?.[0] ? (
                    <img
                      src={cloudinaryUrl(latestMemory.images[0].image_url, 900)}
                      alt={latestMemory.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      decoding="async"
                    />
                  ) : (
                    <div className="absolute inset-0"
                      style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-accent) 10%, transparent), color-mix(in srgb, var(--theme-accent-2) 10%, transparent))' }} />
                  )}
                  <div className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(5,5,8,0.9) 0%, transparent 60%)' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-2 text-theme-accent text-xs mb-2">
                      <Calendar size={12} />
                      {latestMemory ? new Date(latestMemory.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'No memories yet'}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {latestMemory?.title ?? 'Add your first memory'}
                    </h3>
                    <p className="text-white/50 text-sm line-clamp-2">
                      {latestMemory?.description ?? 'Start building your digital memory vault.'}
                    </p>
                  </div>
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium text-theme-accent"
                    style={{ background: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--theme-accent) 20%, transparent)' }}>
                    Latest Memory
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* Story-style Photo Slideshow */}
            <motion.div variants={item}>
              <StoryCard items={validGallery} />
            </motion.div>

            {/* Upcoming Plan */}
            <motion.div variants={item}>
              <Link to="/bucket" className="block group">
                <motion.div
                  whileHover={{ y: -4, boxShadow: 'var(--theme-glow-shadow)' }}
                  className="glass rounded-3xl p-6 h-48 relative cursor-pointer overflow-hidden"
                  style={{ border: '1px solid color-mix(in srgb, var(--theme-accent) 10%, transparent)' }}
                >
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, var(--theme-accent), transparent)' }} />
                  <div className="flex items-center gap-2 text-theme-accent text-xs mb-3">
                    <MapPin size={12} />
                    Next Adventure
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2 leading-tight">
                    {upcomingPlan?.title ?? 'Nothing planned yet'}
                  </h3>
                  <p className="text-white/40 text-sm line-clamp-2">
                    {upcomingPlan?.description ?? 'Add something to your bucket list!'}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs transition-colors opacity-70 group-hover:opacity-100 text-theme-accent">
                    View bucket list <ArrowRight size={12} />
                  </div>
                </motion.div>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={item} className="md:col-span-2">
              <motion.div
                whileHover={{ y: -4 }}
                className="glass rounded-3xl p-6 h-48 grid grid-cols-3 gap-4"
                style={{ border: '1px solid color-mix(in srgb, var(--theme-accent-2) 10%, transparent)' }}
              >
                {[
                  { label: 'Memories', value: memories.length, color: 'var(--theme-accent)' },
                  { label: 'Photos', value: gallery.length, color: 'var(--theme-accent-2)' },
                  { label: 'Adventures', value: bucket.filter(b => b.status === 'completed').length, color: 'color-mix(in srgb, var(--theme-accent) 45%, var(--theme-accent-2))' },
                ].map(stat => (
                  <div key={stat.label} className="flex flex-col items-center justify-center text-center">
                    <div className="text-4xl font-bold mb-1" style={{ color: stat.color,
                      textShadow: `0 0 20px ${stat.color}40` }}>
                      {stat.value}
                    </div>
                    <div className="text-white/40 text-sm">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </PageTransition>
      <AnimatePresence>
        {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
      </AnimatePresence>
    </Layout>
  )
}
