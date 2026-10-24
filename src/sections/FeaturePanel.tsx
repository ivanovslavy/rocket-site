import { useEffect, useRef, type ReactNode } from 'react'
import { ui, useUI } from '../store'
import { CloseIcon } from '../components/icons'
import { MissionContent } from './Mission'
import { TokenomicsContent } from './Tokenomics'
import { AntiBotContent } from './AntiBot'
import { HowToBuyContent } from './HowToBuy'

const TITLES: Record<string, string> = {
  mission: 'The Mission',
  tokenomics: 'Tokenomics',
  antibot: 'Anti-Bot Shield',
  howtobuy: 'How to Buy',
}

function content(id: string | null): ReactNode {
  switch (id) {
    case 'mission':
      return <MissionContent />
    case 'tokenomics':
      return <TokenomicsContent />
    case 'antibot':
      return <AntiBotContent />
    case 'howtobuy':
      return <HowToBuyContent />
    default:
      return null
  }
}

/**
 * The Mission / Tokenomics / How-to-Buy blocks are hidden by default and reveal
 * here exactly like the lore planets:
 *   - hover a planet → preview its section
 *   - leave → hides, UNLESS it was clicked
 *   - click → pins it on screen (stays after the mouse leaves)
 *   - click the same planet again, the ✕, or Escape → hides
 *
 * Non-modal (no blocking backdrop) so hovering/clicking planets keeps working.
 */
export function FeaturePanel() {
  const pinnedId = useUI((s) => s.featurePinned)
  const displayId = useUI((s) => s.featurePinned ?? s.featureHover)
  const open = !!displayId
  const pinned = !!pinnedId

  // keep the last content mounted during the fade-out
  const lastRef = useRef<string | null>(null)
  if (displayId) lastRef.current = displayId
  const id = displayId ?? lastRef.current

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && ui.closeFeature()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-4 transition-opacity duration-300 ${
        open ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden={!open}
    >
      <div
        className={`pointer-events-auto relative w-full max-w-3xl rounded-3xl glass-card p-7 transition-all duration-300 ${
          open ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'
        }`}
      >
        {id && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-sm font-bold uppercase tracking-widest text-rocket-cyan">
                {TITLES[id]}
              </span>
              {pinned && (
                <button
                  onClick={() => ui.closeFeature()}
                  aria-label="Close"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="thin-scroll max-h-[72vh] overflow-y-auto pr-1">
              {content(id)}
            </div>
            <p className="mt-3 text-xs text-white/45">
              {pinned
                ? 'Pinned · click the planet again or ✕ to close'
                : 'Click the planet to keep this open'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
