import { useEffect } from 'react'

/**
 * Shared scroll progress, decoupled from any single library. The HTML content
 * is a normal scrollable DOM overlay (so it keeps the wagmi/RainbowKit React
 * context); the 3D scene reads this module-level state inside useFrame to fly
 * the camera + rocket. offset is 0 at the top, 1 at the bottom — a finite
 * cosmos with a real top and bottom.
 */
export const scrollState = { offset: 0 }

function compute() {
  const doc = document.documentElement
  const max = doc.scrollHeight - doc.clientHeight
  scrollState.offset = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0
}

/** Install the scroll/resize listeners once (call from App). */
export function useScrollProgress() {
  useEffect(() => {
    compute()
    const onScroll = () => compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
}
