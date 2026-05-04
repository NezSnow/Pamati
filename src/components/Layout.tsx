import type { ReactNode } from 'react'
import Navbar from './Navbar'
import AnimatedBackground from './AnimatedBackground'

interface Props {
  children: ReactNode
}

export default function Layout({ children }: Props) {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Navbar />
      <main className="relative z-10 pt-16 pb-20 md:pb-0">
        {children}
      </main>
    </div>
  )
}
