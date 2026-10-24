import { useSyncExternalStore } from 'react'

/**
 * Tiny global UI store shared across the R3F canvas and the HTML layer.
 * R3F runs its own reconciler, so React context doesn't cross the boundary
 * cleanly — a module-level observable store is the reliable bridge.
 */
export interface UIState {
  /** lore chapter currently previewed by hovering its planet */
  loreHover: string | null
  /** lore chapter pinned open by clicking its planet (persists) */
  lorePinned: string | null
  /** a planet whose hover-preview is suppressed until the cursor leaves it
   *  (set right after clicking it closed, so it doesn't immediately re-preview) */
  loreSuppressed: string | null
  /** feature section previewed by hovering its planet (mission|tokenomics|howtobuy) */
  featureHover: string | null
  /** feature section pinned open by clicking its planet (persists) */
  featurePinned: string | null
  /** a feature planet whose hover-preview is suppressed until the cursor leaves */
  featureSuppressed: string | null
  /** id of the moon currently hovered (for the tooltip overlay) */
  hoveredMoon: string | null
  /** id of the pinned tokenomics moon or null */
  pinnedMoon: string | null
  /** lite mode: drop particle counts + postprocessing */
  lite: boolean
  /** user prefers reduced motion */
  reducedMotion: boolean
}

let state: UIState = {
  loreHover: null,
  lorePinned: null,
  loreSuppressed: null,
  featureHover: null,
  featurePinned: null,
  featureSuppressed: null,
  hoveredMoon: null,
  pinnedMoon: null,
  lite: true,
  reducedMotion:
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
}

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

function set(partial: Partial<UIState>) {
  state = { ...state, ...partial }
  emit()
}

export const ui = {
  get: () => state,

  /** which chapter to display: pinned wins over hover */
  activeLore: () => state.lorePinned ?? state.loreHover,

  /** hover a lore planet → preview its chapter. Leaving (id=null) clears any
   *  hover suppression so the planet can preview again on re-entry. */
  hoverLore(id: string | null) {
    if (id === null) {
      if (state.loreHover !== null || state.loreSuppressed !== null)
        set({ loreHover: null, loreSuppressed: null })
      return
    }
    if (id === state.loreSuppressed) return // just closed it; wait for re-entry
    // only one preview panel at a time
    if (state.loreHover !== id) set({ loreHover: id, featureHover: null })
  },

  /** click a lore planet: pin it; clicking the same pinned one hides it
   *  immediately (and suppresses its hover until the cursor leaves). */
  clickLore(id: string) {
    if (state.lorePinned === id)
      set({ lorePinned: null, loreHover: null, loreSuppressed: id })
    else set({ lorePinned: id, loreSuppressed: null, featurePinned: null, featureHover: null })
  },

  /** clear the pinned chapter (e.g. close button / Escape) */
  closeLore() {
    if (state.lorePinned !== null || state.loreHover !== null)
      set({ lorePinned: null, loreHover: null })
  },

  /** which feature section to display: pinned wins over hover */
  activeFeature: () => state.featurePinned ?? state.featureHover,

  /** hover a feature planet → preview its section (mirrors hoverLore) */
  hoverFeature(id: string | null) {
    if (id === null) {
      if (state.featureHover !== null || state.featureSuppressed !== null)
        set({ featureHover: null, featureSuppressed: null })
      return
    }
    if (id === state.featureSuppressed) return // just closed it; wait for re-entry
    // only one preview panel at a time
    if (state.featureHover !== id) set({ featureHover: id, loreHover: null })
  },

  /** click a feature planet: pin it; clicking the same pinned one hides it
   *  immediately (and suppresses its hover until the cursor leaves). */
  clickFeature(id: string) {
    if (state.featurePinned === id)
      set({ featurePinned: null, featureHover: null, featureSuppressed: id })
    else set({ featurePinned: id, featureSuppressed: null, lorePinned: null, loreHover: null })
  },

  closeFeature() {
    if (state.featurePinned !== null || state.featureHover !== null)
      set({ featurePinned: null, featureHover: null })
  },

  /** hover a moon (drives the tooltip overlay) */
  hoverMoon(id: string | null) {
    if (state.hoveredMoon !== id) set({ hoveredMoon: id })
  },

  /** pin a moon's fact; clicking the pinned one again (or empty space) clears */
  pinMoon(id: string | null) {
    if (state.pinnedMoon !== id) set({ pinnedMoon: id })
  },

  setLite(v: boolean) {
    set({ lite: v })
  },
}

// dev-only handle for debugging/automated checks
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __ui?: typeof ui }).__ui = ui
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useUI<T>(selector: (s: UIState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  )
}
