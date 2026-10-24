import * as THREE from 'three'

/**
 * World layout of the finite cosmos.
 *
 * Everything is laid out along -Y. The HTML scroll (drei ScrollControls,
 * offset 0→1) maps to camera.y = -offset * WORLD_HEIGHT, so scrolling down
 * flies the camera deeper down the column of planets. There is a real top
 * (offset 0) and a real bottom (offset 1) — the cosmos is finite.
 */
export const PAGES = 9
export const UNIT_PER_PAGE = 11
export const WORLD_HEIGHT = PAGES * UNIT_PER_PAGE // total -Y travel
export const CAMERA_Z = 15

/** Convert a scroll fraction (0..1) to a world-Y coordinate. */
export const yAt = (offset: number) => -offset * WORLD_HEIGHT

/**
 * Anchors for each section, as a scroll fraction. Used to place planets near
 * the matching HTML content and to drive landing pauses.
 */
// Aligned to the section order in sections/Content.tsx (≈ index / total).
export const ANCHORS = {
  hero: 0.03,
  tokenomicsPlanet: 0.12,
  origin: 0.24,
  crew: 0.35,
  horizon: 0.47,
  // feature planets — evenly spaced (~0.10 apart) so the last three before the
  // swap terminal are no longer cramped.
  mission: 0.55,
  summary: 0.65,
  antibot: 0.75,
  howtobuy: 0.85,
  swap: 0.95,
} as const

export interface PlanetAnchor {
  id: string
  /** world position */
  position: [number, number, number]
  radius: number
}

/** Lore planets — clickable, carry chapters. */
export const LORE_ANCHORS: PlanetAnchor[] = [
  { id: 'origin', position: [-5.2, yAt(ANCHORS.origin), -4], radius: 1.9 },
  { id: 'crew', position: [5.4, yAt(ANCHORS.crew), -5], radius: 2.1 },
  { id: 'horizon', position: [-4.8, yAt(ANCHORS.horizon), -3.5], radius: 2.0 },
]

/** Big tokenomics feature planet, early in the scroll. */
export const TOKENOMICS_ANCHOR: PlanetAnchor = {
  id: 'tokenomics',
  position: [4.6, yAt(ANCHORS.tokenomicsPlanet), -5.5],
  radius: 3.0,
}

/** Decorative (non-clickable) planets for ambiance — no halo. */
export const DECOR_ANCHORS: PlanetAnchor[] = [
  { id: 'd1', position: [-6.5, yAt(0.07), -10], radius: 1.1 },
  { id: 'd2', position: [6.8, yAt(0.19), -12], radius: 1.4 },
  { id: 'd3', position: [-7.2, yAt(0.42), -11], radius: 0.9 },
  { id: 'd4', position: [7.5, yAt(0.54), -13], radius: 1.6 },
  { id: 'd5', position: [-6.0, yAt(0.64), -9], radius: 1.0 },
  { id: 'd6', position: [5.5, yAt(0.78), -14], radius: 1.3 },
]

/**
 * Feature companion planets that sit beside the Mission / Tokenomics summary /
 * How-to-Buy content blocks, so each block visually "comes out of" its planet.
 * Glowing but non-clickable. Colors: yellow / pink / blue.
 */
export interface FeatureAnchor extends PlanetAnchor {
  color: string
  side: 'left' | 'right'
  /** which content panel this planet opens */
  feature: 'mission' | 'tokenomics' | 'antibot' | 'howtobuy'
}
export const FEATURE_ANCHORS: FeatureAnchor[] = [
  { id: 'f-mission', feature: 'mission', position: [-6, yAt(ANCHORS.mission), -2], radius: 2.2, color: '#ffd23f', side: 'left' },
  { id: 'f-tokenomics', feature: 'tokenomics', position: [6, yAt(ANCHORS.summary), -2], radius: 2.3, color: '#ff5cc8', side: 'right' },
  // Anti-bot shield planet — sits between Tokenomics and How-to-Buy.
  { id: 'f-antibot', feature: 'antibot', position: [-6.2, yAt(ANCHORS.antibot), -2.5], radius: 2.0, color: '#16e0c0', side: 'left' },
  { id: 'f-howtobuy', feature: 'howtobuy', position: [6, yAt(ANCHORS.howtobuy), -2], radius: 2.1, color: '#4a9eff', side: 'right' },
]

/** All planets that can "catch" jettisoned coins (clickable + decorative). */
export const ALL_PLANET_TARGETS: PlanetAnchor[] = [
  TOKENOMICS_ANCHOR,
  ...LORE_ANCHORS,
  ...DECOR_ANCHORS,
  ...FEATURE_ANCHORS,
]

/**
 * The rocket's authored flight spline. It weaves on X and Z (drifts toward /
 * away from the camera), swings wide enough to leave frame in cycles, and
 * always stays in front of the planets (z between camera and the planet
 * plane) yet behind the HTML layer (handled by CSS z-index, not 3D).
 */
export function buildFlightPath(): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = []
  const steps = 36
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = yAt(t) + Math.sin(t * Math.PI) * 1.5
    // wide horizontal weave — periodically swings off-frame ("comes and goes")
    const x = Math.sin(t * Math.PI * 5.0) * 6.5 + Math.sin(t * Math.PI * 2) * 1.5
    // z weave: drift toward/away from camera, always in front of planets (> -3)
    const z = Math.sin(t * Math.PI * 6.0) * 3.5 + 1.5
    pts.push(new THREE.Vector3(x, y, z))
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5)
  return curve
}

/**
 * Landing zones: scroll fractions where the rocket should slow, orient toward
 * a planet, pause, then fire thrusters and lift off. Width is the +/- range.
 */
export const LANDING_ZONES = [
  { center: ANCHORS.tokenomicsPlanet, width: 0.035 },
  { center: ANCHORS.crew, width: 0.03 },
  { center: ANCHORS.summary, width: 0.03 },
  { center: ANCHORS.howtobuy, width: 0.03 },
]

/** Returns 0 (cruising) → 1 (fully landed/paused) for the given offset. */
export function landingFactor(offset: number): number {
  let f = 0
  for (const z of LANDING_ZONES) {
    const d = Math.abs(offset - z.center)
    if (d < z.width) {
      f = Math.max(f, 1 - d / z.width)
    }
  }
  return f
}
