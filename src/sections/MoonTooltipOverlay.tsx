import { useEffect, useRef } from 'react'
import { useUI } from '../store'
import { moonPositions } from '../moonTip'
import { MOON_FACTS } from '../copy'
import { MoonTooltip } from './MoonTooltip'

/**
 * Fixed HTML overlay that renders the active moon's fact card right at the
 * moon's projected screen position (≤ ~30px above it). Position is updated via
 * rAF from `moonPositions` so it never triggers per-frame React re-renders;
 * the card content only re-renders when the active moon changes.
 */
export function MoonTooltipOverlay() {
  const hovered = useUI((s) => s.hoveredMoon)
  const pinned = useUI((s) => s.pinnedMoon)
  const activeId = hovered ?? pinned
  const fact = MOON_FACTS.find((f) => f.id === activeId)
  const isPinned = !!activeId && activeId === pinned
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      const el = ref.current
      if (el) {
        const p = activeId ? moonPositions[activeId] : null
        if (p) {
          // anchor the card's bottom-center just above the moon
          el.style.transform = `translate(-50%, -100%) translate(${p.x}px, ${p.y - 14}px)`
          el.style.opacity = '1'
        } else {
          el.style.opacity = '0'
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [activeId])

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-0 top-0 z-30 transition-opacity duration-150"
      style={{ opacity: 0 }}
    >
      {fact && <MoonTooltip fact={fact} pinned={isPinned} />}
    </div>
  )
}
