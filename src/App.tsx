import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { applyFruitThemeToRoot } from './lib/fruitTheme'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import MemoriesPage from './pages/MemoriesPage'
import GalleryPage from './pages/GalleryPage'
import BucketListPage from './pages/BucketListPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl"
          style={{
            background: 'var(--theme-gradient)',
            boxShadow: 'var(--theme-glow-shadow, 0 0 40px rgba(236,72,153,0.3))',
          }}
        >
          ✦
        </div>
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin border-white/20"
          style={{ borderTopColor: 'var(--theme-accent, #ec4899)' }}
        />
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AnimatedRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/memories" element={<ProtectedRoute><MemoriesPage /></ProtectedRoute>} />
      <Route path="/gallery" element={<ProtectedRoute><GalleryPage /></ProtectedRoute>} />
      <Route path="/bucket" element={<ProtectedRoute><BucketListPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AppInner() {
  const { initialize, fruitTheme } = useAuthStore()
  useEffect(() => { initialize() }, [])
  useEffect(() => {
    applyFruitThemeToRoot(fruitTheme)
  }, [fruitTheme])
  return <AnimatedRoutes />
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
