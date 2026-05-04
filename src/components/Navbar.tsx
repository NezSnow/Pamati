import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Image, BookHeart, List, LogOut, Star, Settings, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import ProfileModal from './ProfileModal'

const links = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/memories', label: 'Ganaps', icon: BookHeart },
  { to: '/gallery', label: 'Gallery', icon: Image },
  { to: '/bucket', label: 'Bucket List', icon: List },
]

export default function Navbar() {
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    setDropdownOpen(false)
    await signOut()
    navigate('/login')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div
          className="border-b px-6 py-0"
          style={{
            background: '#090711',
            borderColor: 'color-mix(in srgb, var(--theme-accent) 12%, transparent)',
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: 180, scale: 1.2 }}
                transition={{ duration: 0.4 }}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--theme-gradient)', boxShadow: 'var(--theme-logo-glow)' }}
              >
                <Star size={14} fill="white" color="white" />
              </motion.div>
              <motion.span
                className="font-sponty text-xl gradient-text-static tracking-wide inline-block origin-left"
                whileHover={{ scale: 1.07, y: -2 }}
                transition={{ type: 'spring', stiffness: 420, damping: 20 }}
              >
                Sponty
              </motion.span>
            </NavLink>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {links.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 group ${
                      isActive
                        ? 'text-white'
                        : 'text-white/50 hover:text-white/80'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="navbar-pill"
                          className="absolute inset-0 rounded-xl"
                          style={{
                            background: 'var(--theme-nav-pill-bg)',
                            border: 'var(--theme-nav-pill-border)',
                          }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <Icon size={15} className="relative z-10" />
                      <span className="relative z-10">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* User profile + dropdown */}
            <div className="flex items-center gap-3">
              {profile && (
                <div className="relative" ref={dropdownRef}>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setDropdownOpen(v => !v)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all group"
                    style={{
                      background: dropdownOpen
                        ? 'color-mix(in srgb, var(--theme-accent) 12%, transparent)'
                        : 'transparent',
                      border: '1px solid',
                      borderColor: dropdownOpen
                        ? 'color-mix(in srgb, var(--theme-accent) 28%, transparent)'
                        : 'transparent',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                      style={{
                        border: '2px solid color-mix(in srgb, var(--theme-accent) 50%, transparent)',
                        background: 'var(--theme-gradient)',
                      }}
                    >
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="flex items-center justify-center h-full text-white text-xs font-bold">
                          {profile.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="hidden sm:block text-white/70 text-sm font-medium group-hover:text-white transition-colors">
                      {profile.name}
                    </span>
                    <motion.div
                      animate={{ rotate: dropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={13} className="text-white/40 hidden sm:block" />
                    </motion.div>
                  </motion.button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50"
                        style={{
                          background: '#090711',
                          border: '1px solid color-mix(in srgb, var(--theme-accent) 20%, transparent)',
                          boxShadow: 'var(--theme-glow-shadow)',
                        }}
                      >
                        {/* Profile info header */}
                        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                              style={{
                                border: '2px solid color-mix(in srgb, var(--theme-accent) 50%, transparent)',
                                background: 'var(--theme-gradient)',
                              }}
                            >
                              {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="flex items-center justify-center h-full text-white text-sm font-bold">
                                  {profile.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-sm font-semibold truncate">{profile.name}</p>
                              <p className="text-white/35 text-[11px] truncate">{profile.email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-1.5">
                          <button
                            type="button"
                            onClick={() => { setDropdownOpen(false); setProfileOpen(true) }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white transition-all group"
                            onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--theme-accent) 10%, transparent)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ background: 'color-mix(in srgb, var(--theme-accent) 15%, rgba(255,255,255,0.05))' }}
                            >
                              <Settings size={13} className="text-[var(--theme-accent)]" />
                            </div>
                            Edit Profile
                          </button>

                          <div className="h-px mx-2 my-1" style={{ background: 'rgba(255,255,255,0.06)' }} />

                          <button
                            type="button"
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-red-400 transition-all"
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/10">
                              <LogOut size={13} className="text-red-400/70" />
                            </div>
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 border-t px-2 py-2 flex justify-around"
          style={{
            background: '#090711',
            borderColor: 'color-mix(in srgb, var(--theme-accent) 12%, transparent)',
          }}
        >
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-[var(--theme-accent)]' : 'text-white/40'
                }`
              }
            >
              <Icon size={18} />
              <span className="text-[10px]">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Profile modal */}
      <AnimatePresence>
        {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
