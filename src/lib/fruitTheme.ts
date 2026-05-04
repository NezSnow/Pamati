// Shared fruit / user colorways — login + dashboard use the same palette

export type ThemeKey = 'strawberry' | 'blackberry' | 'blueberry' | 'cherry'

export interface FruitTheme {
  label: string
  user: string
  email: string
  emoji: string
  gradient: string
  bgGradient: string
  blob1: string
  blob2: string
  glow: string
  glowRgb: string
  border: string
  inputFocus: string
  inputFocusBg: string
  buttonGradient: string
  buttonShadow: string
  badgeText: string
  badgeBg: string
  particleColor: string
  /** Second accent for two-tone UI (stats, secondary highlights) */
  accent2: string
}

export const THEMES: Record<ThemeKey, FruitTheme> = {
  strawberry: {
    label: 'Strawberry',
    user: 'Lengua',
    email: 'leslie@sponty.app',
    emoji: '🍓',
    gradient: 'linear-gradient(135deg, #ff6b9d, #ff4577)',
    bgGradient:
      'radial-gradient(ellipse at top left, rgba(255,75,119,0.25) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(255,107,157,0.2) 0%, transparent 60%)',
    blob1: 'rgba(255,75,119,0.3)',
    blob2: 'rgba(255,107,157,0.25)',
    glow: 'rgba(255,75,119,0.35)',
    glowRgb: '255,75,119',
    border: 'rgba(255,107,157,0.35)',
    inputFocus: 'rgba(255,107,157,0.5)',
    inputFocusBg: 'rgba(255,75,119,0.06)',
    buttonGradient: 'linear-gradient(135deg, #ff4577, #ff6b9d)',
    buttonShadow: '0 4px 30px rgba(255,75,119,0.45)',
    badgeText: '#ff9dbb',
    badgeBg: 'rgba(255,75,119,0.12)',
    particleColor: '#ff6b9d',
    accent2: '#ff4577',
  },
  blackberry: {
    label: 'Blackberry',
    user: 'Drew',
    email: 'david@sponty.app',
    emoji: '🫚',
    gradient: 'linear-gradient(135deg, #2d1b69, #1a0a3d)',
    bgGradient:
      'radial-gradient(ellipse at top left, rgba(88,28,135,0.3) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(45,27,105,0.25) 0%, transparent 60%)',
    blob1: 'rgba(88,28,135,0.35)',
    blob2: 'rgba(45,27,105,0.3)',
    glow: 'rgba(88,28,135,0.4)',
    glowRgb: '88,28,135',
    border: 'rgba(139,92,246,0.3)',
    inputFocus: 'rgba(139,92,246,0.45)',
    inputFocusBg: 'rgba(88,28,135,0.08)',
    buttonGradient: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
    buttonShadow: '0 4px 30px rgba(88,28,135,0.5)',
    badgeText: '#a78bfa',
    badgeBg: 'rgba(88,28,135,0.15)',
    particleColor: '#7c3aed',
    accent2: '#a78bfa',
  },
  blueberry: {
    label: 'Blueberry',
    user: 'Paul',
    email: 'paul@sponty.app',
    emoji: '🫐',
    gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    bgGradient:
      'radial-gradient(ellipse at top left, rgba(59,130,246,0.25) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(29,78,216,0.2) 0%, transparent 60%)',
    blob1: 'rgba(59,130,246,0.3)',
    blob2: 'rgba(29,78,216,0.25)',
    glow: 'rgba(59,130,246,0.35)',
    glowRgb: '59,130,246',
    border: 'rgba(96,165,250,0.35)',
    inputFocus: 'rgba(96,165,250,0.5)',
    inputFocusBg: 'rgba(59,130,246,0.06)',
    buttonGradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    buttonShadow: '0 4px 30px rgba(59,130,246,0.45)',
    badgeText: '#93c5fd',
    badgeBg: 'rgba(59,130,246,0.12)',
    particleColor: '#3b82f6',
    accent2: '#60a5fa',
  },
  cherry: {
    label: 'Cherry',
    user: 'Shen',
    email: 'shane@sponty.app',
    emoji: '🍒',
    gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)',
    bgGradient:
      'radial-gradient(ellipse at top left, rgba(239,68,68,0.25) 0%, transparent 60%), radial-gradient(ellipse at bottom right, rgba(185,28,28,0.2) 0%, transparent 60%)',
    blob1: 'rgba(239,68,68,0.3)',
    blob2: 'rgba(185,28,28,0.25)',
    glow: 'rgba(239,68,68,0.35)',
    glowRgb: '239,68,68',
    border: 'rgba(252,165,165,0.35)',
    inputFocus: 'rgba(252,165,165,0.5)',
    inputFocusBg: 'rgba(239,68,68,0.06)',
    buttonGradient: 'linear-gradient(135deg, #dc2626, #ef4444)',
    buttonShadow: '0 4px 30px rgba(239,68,68,0.45)',
    badgeText: '#fca5a5',
    badgeBg: 'rgba(239,68,68,0.12)',
    particleColor: '#ef4444',
    accent2: '#f87171',
  },
}

const EMAIL_TO_THEME: Record<string, ThemeKey> = {
  'leslie@sponty.app': 'strawberry',
  'david@sponty.app': 'blackberry',
  'paul@sponty.app': 'blueberry',
  'shane@sponty.app': 'cherry',
  // Backward compatibility with old domain
  'leslie@pamati.app': 'strawberry',
  'david@pamati.app': 'blackberry',
  'paul@pamati.app': 'blueberry',
  'shane@pamati.app': 'cherry',
}

export function getThemeKeyFromEmail(email: string | undefined | null): ThemeKey | null {
  if (!email) return null
  return EMAIL_TO_THEME[email.toLowerCase().trim()] ?? null
}

export function isThemeKey(v: string | null | undefined): v is ThemeKey {
  return v === 'strawberry' || v === 'blackberry' || v === 'blueberry' || v === 'cherry'
}

/** Canvas particle colors — richer palette per fruit */
export function getParticlePalette(key: ThemeKey): string[] {
  const m: Record<ThemeKey, string[]> = {
    strawberry: ['#ff4577', '#ff6b9d', '#ffb3cc', '#ff2255', '#ffd6e7'],
    blackberry: ['#4c1d95', '#7c3aed', '#a78bfa', '#2d1b69', '#6d28d9'],
    blueberry: ['#1d4ed8', '#3b82f6', '#93c5fd', '#1e40af', '#60a5fa'],
    cherry: ['#b91c1c', '#ef4444', '#fca5a5', '#991b1b', '#f87171'],
  }
  return m[key]
}

const THEME_STYLE_KEYS = [
  '--theme-gradient',
  '--theme-gradient-shimmer',
  '--theme-gradient-static',
  '--theme-bg-overlay',
  '--theme-accent',
  '--theme-accent-2',
  '--theme-blob1',
  '--theme-blob2',
  '--theme-border',
  '--theme-glow-rgb',
  '--theme-nav-pill-bg',
  '--theme-nav-pill-border',
  '--theme-logo-glow',
  '--theme-scrollbar',
  '--theme-selection',
  '--theme-glow-shadow',
]

export function applyFruitThemeToRoot(key: ThemeKey | null) {
  const root = document.documentElement
  if (!key) {
    THEME_STYLE_KEYS.forEach((k) => root.style.removeProperty(k))
    root.removeAttribute('data-fruit-theme')
    return
  }
  const t = THEMES[key]
  root.setAttribute('data-fruit-theme', key)
  root.style.setProperty('--theme-gradient', t.gradient)
  root.style.setProperty(
    '--theme-gradient-shimmer',
    `linear-gradient(135deg, ${t.particleColor}, ${t.accent2}, ${t.particleColor})`
  )
  root.style.setProperty('--theme-gradient-static', t.gradient)
  root.style.setProperty('--theme-bg-overlay', t.bgGradient)
  root.style.setProperty('--theme-accent', t.particleColor)
  root.style.setProperty('--theme-accent-2', t.accent2)
  root.style.setProperty('--theme-blob1', t.blob1)
  root.style.setProperty('--theme-blob2', t.blob2)
  root.style.setProperty('--theme-border', t.border)
  root.style.setProperty('--theme-glow-rgb', t.glowRgb)
  root.style.setProperty(
    '--theme-nav-pill-bg',
    `linear-gradient(135deg, rgba(${t.glowRgb},0.18), rgba(${t.glowRgb},0.08))`
  )
  root.style.setProperty('--theme-nav-pill-border', `1px solid rgba(${t.glowRgb},0.28)`)
  root.style.setProperty('--theme-logo-glow', `0 0 24px rgba(${t.glowRgb},0.35)`)
  root.style.setProperty('--theme-scrollbar', `linear-gradient(to bottom, ${t.particleColor}, ${t.accent2})`)
  root.style.setProperty('--theme-selection', `rgba(${t.glowRgb},0.4)`)
  root.style.setProperty('--theme-glow-shadow', `0 8px 32px rgba(${t.glowRgb},0.35)`)
}
