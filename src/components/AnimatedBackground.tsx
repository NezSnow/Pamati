import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { THEMES, getParticlePalette, type ThemeKey } from '../lib/fruitTheme'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fruitTheme = useAuthStore((s) => s.fruitTheme)
  const themeKey: ThemeKey = fruitTheme ?? 'strawberry'
  const t = THEMES[themeKey]
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const animateBlobs = !isMobile && !reduceMotion

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isMobile = window.innerWidth < 768
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Fewer particles on mobile / reduced-motion; no glow on mobile (expensive)
    const particleCount = reduceMotion ? 0 : isMobile ? 15 : 45
    const useGlow = !isMobile && !reduceMotion

    const colors = getParticlePalette(themeKey)
    let animId: number
    const particles: Particle[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: isMobile ? Math.random() * 1.5 + 0.5 : Math.random() * 3 + 1,
        opacity: isMobile ? Math.random() * 0.3 + 0.1 : Math.random() * 0.55 + 0.25,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        if (useGlow) {
          ctx.shadowBlur = 14
          ctx.shadowColor = p.color
        }
        ctx.fill()

        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      }
      ctx.globalAlpha = 1
      if (useGlow) ctx.shadowBlur = 0

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [themeKey])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#050508]" />

      <motion.div
        key={`b1-${themeKey}`}
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: `radial-gradient(circle, ${t.particleColor} 0%, transparent 70%)` }}
        animate={animateBlobs ? { x: [0, 40, 0], y: [0, 30, 0] } : {}}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        key={`b2-${themeKey}`}
        className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full opacity-20"
        style={{ background: `radial-gradient(circle, ${t.accent2} 0%, transparent 70%)` }}
        animate={animateBlobs ? { x: [0, -50, 0], y: [0, -40, 0] } : {}}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        key={`b3-${themeKey}`}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: `radial-gradient(circle, ${t.badgeText} 0%, transparent 70%)` }}
        animate={animateBlobs ? { scale: [1, 1.2, 1], rotate: [0, 180, 360] } : {}}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
