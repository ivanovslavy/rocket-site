import { useEffect, useRef } from 'react'
import { LORE_CHAPTERS, type LoreChapterCopy } from '../copy'
import { ui, useUI } from '../store'
import { CloseIcon, SparkIcon } from '../components/icons'

/**
 * Lore display. There is no story text on the page until you interact with a
 * glowing story planet:
 *   - hover a planet → preview its chapter here
 *   - leave → hides, UNLESS it was clicked
 *   - click → pins it on screen (stays after the mouse leaves)
 *   - click the same planet again → hides
 *
 * Single panel, fixed position → texts never overlap and stay readable. No
 * full-screen backdrop, so hovering/clicking planets keeps working underneath.
 */
export function LorePanel() {
  const pinnedId = useUI((s) => s.lorePinned)
  const displayId = useUI((s) => s.lorePinned ?? s.loreHover)
  const current = LORE_CHAPTERS.find((c) => c.id === displayId)
  const open = !!current
  const pinned = !!pinnedId

  // keep the last chapter mounted during the fade-out
  const lastRef = useRef<LoreChapterCopy | null>(null)
  if (current) lastRef.current = current
  const ch = current ?? lastRef.current

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && ui.closeLore()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 transition-all duration-300 ease-out ${
        open ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
      aria-hidden={!open}
    >
      <div className="pointer-events-auto w-full max-w-lg rounded-3xl glass-card p-7">
        {ch && (
          <>
            {pinned && (
              <button
                onClick={() => ui.closeLore()}
                aria-label="Close"
                className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            )}

            <div className="flex items-center gap-2 text-sm font-bold tracking-widest text-rocket-cyan">
              <SparkIcon className="h-4 w-4" />
              {ch.chapter.toUpperCase()}
            </div>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-white heading-glow sm:text-4xl">
              {ch.planet}
            </h2>
            <p className="mt-1 text-lg italic text-rocket-cyan">{ch.subtitle}</p>
            <p className="mt-4 max-h-[50vh] overflow-y-auto pr-1 text-base leading-relaxed text-white/90 thin-scroll">
              {ch.body}
            </p>
            <p className="mt-3 text-xs text-white/45">
              {pinned ? 'Pinned · click the planet again or ✕ to close' : 'Click the planet to keep this open'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
