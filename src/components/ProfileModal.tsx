import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, User, Lock, Check, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

type Tab = 'profile' | 'password'

interface Props {
  onClose: () => void
}

export default function ProfileModal({ onClose }: Props) {
  const { profile, updateProfile, updatePassword, uploadAvatar } = useAuthStore()

  const [tab, setTab] = useState<Tab>('profile')
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(profile?.name ?? '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passSaving, setPassSaving] = useState(false)
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setProfileSaving(true)
    setProfileMsg(null)

    // 1. Save name immediately (optimistic — feels instant)
    const { error } = await updateProfile({ name: name.trim() })
    if (error) {
      setProfileSaving(false)
      setProfileMsg({ ok: false, text: error })
      return
    }

    setProfileSaving(false)
    setProfileMsg({ ok: true, text: 'Saved!' })
    setAvatarFile(null)

    // 2. Upload avatar in the background after UI has already confirmed success
    if (avatarFile) {
      uploadAvatar(avatarFile).then(url => {
        if (url) updateProfile({ avatar_url: url })
      })
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPass.length < 6) {
      setPassMsg({ ok: false, text: 'Password must be at least 6 characters.' })
      return
    }
    if (newPass !== confirmPass) {
      setPassMsg({ ok: false, text: 'Passwords do not match.' })
      return
    }
    setPassSaving(true)
    setPassMsg(null)
    const { error } = await updatePassword(newPass)
    setPassSaving(false)
    if (error) {
      setPassMsg({ ok: false, text: error })
    } else {
      setPassMsg({ ok: true, text: 'Password changed successfully!' })
      setNewPass('')
      setConfirmPass('')
    }
  }

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl text-white placeholder-white/20 text-sm outline-none transition-all'
  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 24 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: '#0d0a1a',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Coloured header band */}
        <div
          className="h-28 relative flex items-center justify-center overflow-hidden"
          style={{ background: 'var(--theme-gradient)' }}
        >
          {/* Subtle radial shine */}
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(255,255,255,0.22) 0%, transparent 70%)' }}
          />
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5), transparent 70%)' }} />
          <div className="absolute -left-6 bottom-0 w-24 h-24 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5), transparent 70%)' }} />

          <p className="relative z-10 font-sponty text-2xl text-white drop-shadow-lg select-none">
            My Profile
          </p>
        </div>

        {/* Avatar — centered, overlapping the band */}
        <div className="flex justify-center -mt-10 mb-3 relative z-10">
          <motion.button
            type="button"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => fileRef.current?.click()}
            className="relative w-20 h-20 rounded-full overflow-hidden group"
            style={{
              border: '3px solid #0d0a1a',
              outline: '2px solid rgba(255,255,255,0.18)',
              background: 'var(--theme-gradient)',
              boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
            }}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="flex items-center justify-center h-full text-white text-2xl font-bold select-none">
                {profile?.name?.charAt(0).toUpperCase() ?? '?'}
              </span>
            )}
            <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={18} className="text-white" />
            </div>
          </motion.button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
        </div>

        {/* Name & email */}
        <p className="text-center text-white font-semibold text-base leading-tight">{profile?.name}</p>
        <p className="text-center text-white/35 text-[11px] mt-0.5 mb-5">{profile?.email}</p>

        {/* Tab switcher */}
        <div className="mx-5 mb-4 flex rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {(['profile', 'password'] as Tab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-sm font-medium transition-colors duration-200 z-10"
              style={{ color: tab === t ? '#fff' : 'rgba(255,255,255,0.35)' }}
            >
              {tab === t && (
                <motion.div
                  layoutId="pm-tab-pill"
                  className="absolute inset-0 rounded-[10px] z-[-1]"
                  style={{ background: 'var(--theme-gradient)' }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              {t === 'profile' ? <User size={12} /> : <Lock size={12} />}
              {t === 'profile' ? 'Profile' : 'Password'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-5 pb-6">
          <AnimatePresence mode="wait">
            {tab === 'profile' ? (
              <motion.form
                key="profile"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleProfileSave}
                className="space-y-3"
              >
                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1.5">
                    Display Name
                  </label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="Your name…"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1.5">
                    Profile Picture
                  </label>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px dashed rgba(255,255,255,0.18)',
                      color: avatarFile ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    <Camera size={13} />
                    <span className="truncate">{avatarFile ? avatarFile.name : 'Upload new photo'}</span>
                  </button>
                </div>

                {profileMsg && (
                  <Feedback ok={profileMsg.ok} text={profileMsg.text} />
                )}

                <SaveBtn loading={profileSaving} label="Save Changes" icon={<Check size={13} />} />
              </motion.form>
            ) : (
              <motion.form
                key="password"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                onSubmit={handlePasswordSave}
                className="space-y-3"
              >
                <PasswordField
                  label="New Password"
                  value={newPass}
                  show={showNew}
                  onToggle={() => setShowNew(v => !v)}
                  onChange={e => setNewPass(e.target.value)}
                  inputCls={inputCls}
                  inputStyle={inputStyle}
                />
                <PasswordField
                  label="Confirm Password"
                  value={confirmPass}
                  show={showConfirm}
                  onToggle={() => setShowConfirm(v => !v)}
                  onChange={e => setConfirmPass(e.target.value)}
                  inputCls={inputCls}
                  inputStyle={inputStyle}
                />

                {passMsg && (
                  <Feedback ok={passMsg.ok} text={passMsg.text} />
                )}

                <SaveBtn loading={passSaving} label="Change Password" icon={<Lock size={13} />} />
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.6)' }}
        >
          <X size={14} />
        </button>
      </motion.div>
    </motion.div>
  )
}

/* ── small helpers ─────────────────────────────────────────── */

function Feedback({ ok, text }: { ok: boolean; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
      style={ok
        ? { color: '#6ee7b7', background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)' }
        : { color: '#fca5a5', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}
    >
      {ok ? <Check size={12} /> : <AlertCircle size={12} />}
      {text}
    </motion.div>
  )
}

function SaveBtn({ loading, label, icon }: { loading: boolean; label: string; icon: React.ReactNode }) {
  return (
    <motion.button
      type="submit"
      disabled={loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full py-2.5 rounded-xl font-medium text-white text-sm flex items-center justify-center gap-2 disabled:opacity-60"
      style={{ background: 'var(--theme-gradient)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : icon}
      {loading ? 'Saving…' : label}
    </motion.button>
  )
}

function PasswordField({
  label, value, show, onToggle, onChange, inputCls, inputStyle,
}: {
  label: string
  value: string
  show: boolean
  onToggle: () => void
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  inputCls: string
  inputStyle: React.CSSProperties
}) {
  return (
    <div>
      <label className="block text-white/40 text-[10px] uppercase tracking-widest mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          placeholder="••••••••"
          className={`${inputCls} pr-10`}
          style={inputStyle}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: 'rgba(255,255,255,0.28)' }}
        >
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
    </div>
  )
}
