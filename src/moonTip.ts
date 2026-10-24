/**
 * Live screen-space positions of the tokenomics moons, written each frame by
 * Moon.tsx (projected with the actual render camera) and read by the fixed
 * HTML tooltip overlay. Kept out of React state so per-frame updates don't
 * trigger re-renders. We bypass drei <Html> here because its vertical
 * projection was unreliable with the scroll-driven moving camera.
 */
export const moonPositions: Record<string, { x: number; y: number }> = {}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __moon?: typeof moonPositions }).__moon = moonPositions
}
