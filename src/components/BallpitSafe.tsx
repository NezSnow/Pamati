import { Component, type ReactNode, useEffect, useRef } from 'react'

// ─── Error boundary so a WebGL crash never kills the parent page ──────────────
interface EBState { crashed: boolean }
class BallpitBoundary extends Component<{ children: ReactNode }, EBState> {
  state = { crashed: false }
  static getDerivedStateFromError() { return { crashed: true } }
  render() {
    if (this.state.crashed) return null   // silent fallback
    return this.props.children
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface BallpitProps {
  count?: number
  gravity?: number
  friction?: number
  wallBounce?: number
  followCursor?: boolean
  colors?: (string | number)[]
  className?: string
}

// ─── Inner canvas component ───────────────────────────────────────────────────
function BallpitInner({ followCursor = true, colors, className = '', ...props }: BallpitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const instanceRef = useRef<any>(null)
  const colorsRef = useRef(colors)
  colorsRef.current = colors

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let disposed = false
    let instance: any = null

    async function init() {
      if (!canvas) return
      // Wait until the canvas actually has layout dimensions
      await new Promise<void>(resolve => {
        if (canvas!.offsetWidth > 0 && canvas!.offsetHeight > 0) { resolve(); return }
        const ro = new ResizeObserver(() => {
          if (canvas!.offsetWidth > 0 && canvas!.offsetHeight > 0) { ro.disconnect(); resolve() }
        })
        const target = canvas!.parentElement ?? canvas!
        ro.observe(target)
        // Timeout safety: resolve after 2s regardless
        setTimeout(() => { ro.disconnect(); resolve() }, 2000)
      })

      if (disposed) return

      try {
        // Dynamic import so parse errors don't crash the module
        const { default: createBallpit } = await import('./_ballpit_impl')
        instance = createBallpit(canvas!, { followCursor, colors: colorsRef.current, ...props })
        instanceRef.current = instance
      } catch (err) {
        console.warn('[Ballpit] WebGL init failed, falling back silently.', err)
      }
    }

    init()

    return () => {
      disposed = true
      instance?.dispose?.()
      instanceRef.current?.dispose?.()
      instanceRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update colors live when prop changes
  useEffect(() => {
    if (instanceRef.current && colors) {
      try { instanceRef.current.setColors?.(colors) } catch (_) {}
    }
  }, [colors])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}

// ─── Public export — always wrapped in error boundary ─────────────────────────
export default function Ballpit(props: BallpitProps) {
  return (
    <BallpitBoundary>
      <BallpitInner {...props} />
    </BallpitBoundary>
  )
}
