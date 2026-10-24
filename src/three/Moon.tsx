import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Outlines } from '@react-three/drei'
import { ClickableHalo } from './ClickableHalo'
import { ui, useUI } from '../store'
import { moonPositions } from '../moonTip'
import type { MoonFact } from '../copy'

/**
 * A clickable satellite orbiting the tokenomics planet. Each moon carries one
 * tokenomics fact.
 *
 * Interaction:
 *  - hover → fact tooltip appears right at the moon (freezes its orbit)
 *  - mouse leaves → tooltip hides, UNLESS this moon is pinned
 *  - click → pin this fact (persists after mouse leaves)
 *  - click empty space → close (Canvas onPointerMissed)
 *
 * The tooltip itself is a fixed HTML overlay (App) positioned from the moon's
 * projected screen position written here each frame.
 */
export function Moon({
  fact,
  orbitRadius,
  speed,
  phase,
  size,
  color,
}: {
  fact: MoonFact
  orbitRadius: number
  speed: number
  phase: number
  size: number
  color: string
}) {
  const group = useRef<THREE.Group>(null!)
  const mat = useRef<THREE.MeshToonMaterial>(null!)
  const tRef = useRef(phase)
  const v = useMemo(() => new THREE.Vector3(), [])
  const [hovered, setHovered] = useState(false)
  const pinned = useUI((s) => s.pinnedMoon === fact.id)
  const show = hovered || pinned

  useFrame((state, delta) => {
    // freeze the orbit while hovered/pinned so the moon + its tooltip stay put
    if (!show) tRef.current += delta * speed
    const t = tRef.current
    if (group.current) {
      group.current.position.set(
        Math.cos(t) * orbitRadius,
        Math.sin(t) * orbitRadius * 0.45,
        Math.sin(t) * orbitRadius * 0.6,
      )
      // project the moon to screen space for the HTML tooltip overlay
      if (show) {
        v.setFromMatrixPosition(group.current.matrixWorld)
        v.project(state.camera)
        moonPositions[fact.id] = {
          x: (v.x * 0.5 + 0.5) * state.size.width,
          y: (-v.y * 0.5 + 0.5) * state.size.height,
        }
      }
    }
    // emissive flicker so the moon visibly blinks; pinned moon stays lit
    if (mat.current) {
      const flicker = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2.2 + phase)
      const base = pinned ? 0.75 : hovered ? 0.6 : 0.3
      mat.current.emissiveIntensity = base + flicker * (pinned ? 0.2 : 0.35)
    }
  })

  return (
    <group ref={group}>
      <ClickableHalo radius={size} color={color} speed={2.2} lit={pinned} />
      <mesh
        onPointerOver={(e) => {
          if ((e.nativeEvent?.buttons ?? 0) !== 0) return // drag/selection, not a hover
          e.stopPropagation()
          setHovered(true)
          ui.hoverMoon(fact.id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          ui.hoverMoon(null)
          document.body.style.cursor = 'auto'
        }}
        onClick={(e) => {
          e.stopPropagation()
          ui.pinMoon(pinned ? null : fact.id)
        }}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshToonMaterial ref={mat} color={color} emissive={color} emissiveIntensity={0.15} />
        <Outlines thickness={3} color="#06061c" />
      </mesh>
    </group>
  )
}
