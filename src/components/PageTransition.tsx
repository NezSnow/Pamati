import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function PageTransition({ children }: Props) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}
