import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { scrollState } from '../scroll'

/**
 * Tracks scroll offset + a smoothed scroll velocity from the shared scroll
 * state. Returns refs (read inside useFrame) so we never trigger React
 * re-renders per frame. velocity is normalized-ish and clamped to [0, 1].
 */
export function useScrollVelocity() {
  const offset = useRef(0)
  const velocity = useRef(0)
  const lastOffset = useRef(0)

  useFrame((_, delta) => {
    const o = scrollState.offset
    offset.current = o
    const raw = Math.abs(o - lastOffset.current) / Math.max(delta, 0.0001)
    lastOffset.current = o
    const target = Math.min(raw * 0.6, 1)
    velocity.current += (target - velocity.current) * Math.min(delta * 6, 1)
  })

  return { offset, velocity }
}
