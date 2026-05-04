import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import Ballpit from '../components/Ballpit'
import Grainient from '../components/Grainient'
import { THEMES, getThemeKeyFromEmail, type ThemeKey } from '../lib/fruitTheme'

const FRUIT_KEYS: ThemeKey[] = ['strawberry', 'blackberry', 'blueberry', 'cherry']

// Blackberry uses a custom SVG since there's no standard emoji
function BlackberryIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="11" cy="11" r="4.5" fill="#4c1d95" />
      <circle cx="21" cy="11" r="4.5" fill="#3b0764" />
      <circle cx="11" cy="21" r="4.5" fill="#3b0764" />
      <circle cx="21" cy="21" r="4.5" fill="#4c1d95" />
      <circle cx="16" cy="16" r="4.5" fill="#5b21b6" />
      <circle cx="11" cy="11" r="2" fill="#7c3aed" opacity="0.5" />
      <circle cx="21" cy="11" r="2" fill="#7c3aed" opacity="0.5" />
      <circle cx="11" cy="21" r="2" fill="#7c3aed" opacity="0.5" />
      <circle cx="21" cy="21" r="2" fill="#7c3aed" opacity="0.5" />
      <circle cx="16" cy="16" r="2" fill="#8b5cf6" opacity="0.6" />
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey | null>(null)
  const [themeError, setThemeError] = useState<string | null>(null)
  const { signIn, loading, error, user } = useAuthStore()

  if (user) return <Navigate to="/" replace />

  const theme = selectedTheme ? THEMES[selectedTheme] : null

  const handleFruitSelect = (key: ThemeKey) => {
    setSelectedTheme(key)
    setThemeError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTheme || !theme) return

    // Validate: check if the email belongs to the selected fruit user
    const normalizedEmail = email.toLowerCase().trim()
    if (normalizedEmail && getThemeKeyFromEmail(normalizedEmail) !== selectedTheme) {
      setThemeError(`Wrong theme selected for this user. ${theme.label} is for ${theme.user} only.`)
      return
    }

    setThemeError(null)
    await signIn(email, password, selectedTheme)
  }

  const inputFocusStyle = theme ? {
    border: `1px solid ${theme.inputFocus}`,
    background: theme.inputFocusBg,
    boxShadow: `0 0 20px rgba(${theme.glowRgb},0.15)`,
  } : {
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.06)',
    boxShadow: 'none',
  }

  const inputBlurStyle = {
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    boxShadow: 'none',
  }

  // Ball colors per theme — 3 shades each for depth
  const ballColors: Record<string, string[]> = {
    strawberry: ['#ff4577', '#ff6b9d', '#ffb3cc', '#ff2255', '#ffd6e7'],
    blackberry: ['#4c1d95', '#7c3aed', '#a78bfa', '#2d1b69', '#6d28d9'],
    blueberry:  ['#1d4ed8', '#3b82f6', '#93c5fd', '#1e40af', '#60a5fa'],
    cherry:     ['#b91c1c', '#ef4444', '#fca5a5', '#991b1b', '#f87171'],
    default:    ['#3a3a4a', '#4a4a5a', '#5a5a6a', '#2a2a3a', '#6a6a7a'],
  }
  const activeBallColors = selectedTheme
    ? ballColors[selectedTheme]
    : ballColors.default

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: '#050508' }}>

      {/* React Bits–style Grainient — full viewport until user picks a fruit */}
      <AnimatePresence>
        {!selectedTheme && (
          <motion.div
            key="grainient-idle"
            className="absolute inset-0 z-0"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            <Grainient
              color1="#FF9FFC"
              color2="#5227FF"
              color3="#B19EEF"
              timeSpeed={0.25}
              colorBalance={0}
              warpStrength={1}
              warpFrequency={5}
              warpSpeed={2}
              warpAmplitude={50}
              blendAngle={0}
              blendSoftness={0.05}
              rotationAmount={500}
              noiseScale={2}
              grainAmount={0.1}
              grainScale={2}
              grainAnimated={false}
              contrast={1.5}
              gamma={1}
              saturation={1}
              centerX={0}
              centerY={0}
              zoom={0.9}
              className="min-h-[100dvh] h-full w-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* After fruit select: themed radial fallback + Ballpit */}
      {selectedTheme && (
        <>
          <div
            className="absolute inset-0 z-0"
            style={{
              background: `radial-gradient(ellipse at 30% 40%, ${THEMES[selectedTheme].blob1} 0%, transparent 55%),
               radial-gradient(ellipse at 70% 60%, ${THEMES[selectedTheme].blob2} 0%, transparent 55%),
               #050508`,
              transition: 'background 0.7s ease',
            }}
          />
          <div className="absolute inset-0 z-[1]" style={{ opacity: 0.85 }}>
            <Ballpit
              count={90}
              gravity={0.18}
              friction={0.9975}
              wallBounce={0.88}
              followCursor={true}
              colors={activeBallColors}
            />
          </div>
        </>
      )}

      {/* Readability overlay — lighter while Grainient is visible */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background: selectedTheme ? 'rgba(5,5,8,0.45)' : 'rgba(5,5,8,0.28)',
        }}
      />

      {/* Animated background blobs */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-[3]"
        animate={{ opacity: theme ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      >
        {theme && (
          <>
            <motion.div
              key={`blob1-${selectedTheme}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
              style={{ background: `radial-gradient(circle, ${theme.blob1} 0%, transparent 70%)` }}
            />
            <motion.div
              key={`blob2-${selectedTheme}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full"
              style={{ background: `radial-gradient(circle, ${theme.blob2} 0%, transparent 70%)` }}
            />
          </>
        )}
        {/* Default neutral blobs */}
      </motion.div>

      <div className="relative z-[4] w-full max-w-md px-6">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        >
          {/* App title — playful letter pop + soft float */}
          <div className="text-center mb-8">
            <motion.div
              className="mx-auto mb-3 w-max max-w-full cursor-default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08 }}
              whileHover={{ scale: 1.04 }}
              style={{ perspective: 600 }}
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 2.75,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <h1
                  className="font-sponty text-5xl sm:text-6xl inline-flex leading-none select-none"
                  aria-label="Sponty"
                >
                  {'Sponty'.split('').map((char, i) => (
                    <motion.span
                      key={`${char}-${i}`}
                      className="inline-block bg-clip-text text-transparent"
                      style={{
                        backgroundImage: theme
                          ? theme.gradient
                          : 'linear-gradient(135deg, #FF9FFC 0%, #B19EEF 45%, #5227FF 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 28px rgba(255, 159, 252, 0.22))',
                      }}
                      initial={{ opacity: 0, y: 36, rotate: -10, scale: 0.45 }}
                      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 13,
                        mass: 0.65,
                        delay: 0.1 + i * 0.072,
                      }}
                      whileHover={{
                        y: -5,
                        rotate: -6,
                        scale: 1.12,
                        transition: { type: 'spring', stiffness: 380, damping: 12 },
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </h1>
              </motion.div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/30 text-xs tracking-widest uppercase"
            >
              Our Memories · Our Story
            </motion.p>
          </div>

          {/* Fruit Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-5"
          >
            <p className="text-center text-white/30 text-xs uppercase tracking-widest mb-4">
              Who are you?
            </p>
            <div className="grid grid-cols-4 gap-3">
              {FRUIT_KEYS.map((key) => {
                const t = THEMES[key]
                const isSelected = selectedTheme === key
                return (
                  <motion.button
                    key={key}
                    type="button"
                    onClick={() => handleFruitSelect(key)}
                    whileHover={{ scale: 1.08, y: -4 }}
                    whileTap={{ scale: 0.93 }}
                    className="relative flex flex-col items-center gap-2 py-4 rounded-2xl transition-all duration-300"
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, rgba(${t.glowRgb},0.2), rgba(${t.glowRgb},0.08))`
                        : 'rgba(255,255,255,0.04)',
                      border: isSelected
                        ? `1px solid ${t.border}`
                        : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: isSelected
                        ? `0 0 20px rgba(${t.glowRgb},0.25), 0 0 40px rgba(${t.glowRgb},0.1)`
                        : 'none',
                    }}
                  >
                    {/* Selected ring pulse */}
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        initial={{ opacity: 0.6, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.12 }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        style={{ border: `1px solid rgba(${t.glowRgb},0.5)` }}
                      />
                    )}

                    {/* Fruit icon */}
                    <div className="text-3xl leading-none select-none">
                      {key === 'blackberry'
                        ? <BlackberryIcon size={32} />
                        : t.emoji}
                    </div>

                    {/* Name */}
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider transition-all duration-300"
                      style={{ color: isSelected ? t.badgeText : 'rgba(255,255,255,0.3)' }}
                    >
                      {t.user}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          {/* Login Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="rounded-3xl p-7"
            style={{
              background: 'rgba(10,8,20,0.7)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              border: theme
                ? `1px solid ${theme.border}`
                : '1px solid rgba(255,255,255,0.07)',
              boxShadow: theme
                ? `0 8px 60px rgba(${theme.glowRgb},0.1), 0 0 0 1px rgba(${theme.glowRgb},0.08)`
                : '0 8px 60px rgba(0,0,0,0.3)',
              transition: 'border 0.5s ease, box-shadow 0.5s ease',
            }}
          >
            {/* Card header */}
            <div className="flex items-center gap-2 mb-5">
              <AnimatePresence mode="wait">
                {theme ? (
                  <motion.div
                    key={selectedTheme}
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 20 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                    style={{ background: `linear-gradient(135deg, rgba(${theme.glowRgb},0.25), rgba(${theme.glowRgb},0.1))` }}
                  >
                    {selectedTheme === 'blackberry' ? <BlackberryIcon size={18} /> : theme.emoji}
                  </motion.div>
                ) : (
                  <motion.div key="default"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <Sparkles size={14} className="text-white/30" />
                  </motion.div>
                )}
              </AnimatePresence>
              <div>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={selectedTheme ?? 'none'}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.25 }}
                    className="text-sm font-medium"
                    style={{ color: theme ? theme.badgeText : 'rgba(255,255,255,0.35)' }}
                  >
                    {theme ? `Welcome, ${theme.user}` : 'Select your fruit to continue'}
                  </motion.p>
                </AnimatePresence>
                <p className="text-white/25 text-xs">Private access only</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-white/40 text-xs uppercase tracking-widest mb-2 ml-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={theme ? `${theme.email}` : 'select your fruit first'}
                  required
                  disabled={!selectedTheme}
                  className="w-full px-4 py-3.5 rounded-xl text-white placeholder-white/15 text-sm transition-all duration-300 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={e => Object.assign(e.target.style, inputBlurStyle)}
                />
              </div>

              <div>
                <label className="block text-white/40 text-xs uppercase tracking-widest mb-2 ml-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={!selectedTheme}
                    className="w-full px-4 py-3.5 pr-12 rounded-xl text-white placeholder-white/15 text-sm transition-all duration-300 outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    onFocus={e => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={e => Object.assign(e.target.style, inputBlurStyle)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Theme mismatch error */}
              <AnimatePresence>
                {themeError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: theme ? `rgba(${theme.glowRgb},0.1)` : 'rgba(255,100,100,0.1)',
                      border: `1px solid ${theme ? theme.border : 'rgba(255,100,100,0.25)'}`,
                      color: theme ? theme.badgeText : '#fca5a5',
                    }}
                  >
                    🚫 {themeError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Supabase auth error */}
              <AnimatePresence>
                {error && !themeError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: theme ? `rgba(${theme.glowRgb},0.1)` : 'rgba(255,100,100,0.1)',
                      border: `1px solid ${theme ? theme.border : 'rgba(255,100,100,0.25)'}`,
                      color: theme ? theme.badgeText : '#fca5a5',
                    }}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={loading || !selectedTheme}
                whileHover={selectedTheme ? { scale: 1.02 } : {}}
                whileTap={selectedTheme ? { scale: 0.98 } : {}}
                className="w-full py-3.5 rounded-xl font-semibold text-white text-sm mt-2 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: theme ? theme.buttonGradient : 'rgba(255,255,255,0.07)',
                  boxShadow: theme ? theme.buttonShadow : 'none',
                }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Entering...
                  </span>
                ) : !selectedTheme ? (
                  'Select your fruit first ↑'
                ) : (
                  `Enter as ${theme!.user} ${theme!.emoji}`
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center gap-4 mt-6"
          >
            {FRUIT_KEYS.map(key => (
              <span key={key} className="text-lg opacity-30 hover:opacity-70 transition-opacity cursor-pointer"
                onClick={() => handleFruitSelect(key)}>
                {key === 'blackberry' ? '🍇' : THEMES[key].emoji}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
