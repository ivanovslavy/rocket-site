import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Outlines } from '@react-three/drei'
import { ClickableHalo } from './ClickableHalo'
import { ui, useUI } from '../store'

/**
 * A clickable toon lore planet. Carries the gentle blinking halo (the "click
 * me" cue), a banded toon material, thick outline, and a simple smiley face.
 *
 * Interaction (mirrors the moons):
 *  - hover → preview its lore chapter (LorePanel)
 *  - leave → hides, unless it was clicked
 *  - click → pin the chapter on screen; click the same planet again → hide
 *
 * The flicker also lights the planet itself (emissive pulse); a pinned planet
 * stays lit.
 */
export function Planet({
  id,
  position,
  radius,
  color,
  haloColor,
  face = true,
  spin = 0.12,
  initialAngle = 0,
}: {
  id: string
  position: [number, number, number]
  radius: number
  color: string
  haloColor: string
  face?: boolean
  /** rotation speed (rad/s); sign sets direction so each planet spins its own way */
  spin?: number
  /** starting Y rotation so smileys don't all face front at once */
  initialAngle?: number
}) {
  const group = useRef<THREE.Group>(null!)
  const mat = useRef<THREE.MeshToonMaterial>(null!)
  const [hovered, setHovered] = useState(false)
  const pinned = useUI((s) => s.lorePinned === id)
  const phase = useRef(Math.random() * Math.PI * 2)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime * 1.4 + phase.current
    const flicker = 0.5 + 0.5 * Math.sin(t)
    if (group.current) {
      group.current.rotation.y += delta * spin
      const target = pinned ? 1.12 : hovered ? 1.06 : 1
      const s = THREE.MathUtils.damp(group.current.scale.x, target, 6, delta)
      group.current.scale.setScalar(s)
    }
    // emissive pulse so the planet itself visibly blinks/lights up with the halo
    if (mat.current) {
      const base = pinned ? 0.7 : hovered ? 0.55 : 0.28
      const amp = pinned ? 0.25 : 0.35
      mat.current.emissiveIntensity = base + flicker * amp
    }
  })

  return (
    <group position={position}>
      <ClickableHalo radius={radius} color={haloColor} lit={pinned} />
      <group
        ref={group}
        rotation={[0, initialAngle, 0]}
        onPointerOver={(e) => {
          // ignore while a mouse button is held — that's a drag/text-selection, not a hover
          if ((e.nativeEvent?.buttons ?? 0) !== 0) return
          e.stopPropagation()
          setHovered(true)
          ui.hoverLore(id)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          ui.hoverLore(null)
          document.body.style.cursor = 'auto'
        }}
        onClick={(e) => {
          e.stopPropagation()
          ui.clickLore(id)
        }}
      >
        <mesh>
          <sphereGeometry args={[radius, 48, 48]} />
          <meshToonMaterial ref={mat} color={color} emissive={color} emissiveIntensity={0.12} />
          <Outlines thickness={4} color="#06061c" />
        </mesh>
        {face && <SmileyFace radius={radius} />}
      </group>
    </group>
  )
}

/** Simple childlike smiley on the planet front (two eyes + a smile arc). */
function SmileyFace({ radius }: { radius: number }) {
  const z = radius * 0.92
  const eyeY = radius * 0.18
  const eyeX = radius * 0.3
  return (
    <group position={[0, 0, z]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * eyeX, eyeY, 0]}>
          <sphereGeometry args={[radius * 0.1, 16, 16]} />
          <meshBasicMaterial color="#06061c" toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, -radius * 0.1, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[radius * 0.32, radius * 0.05, 12, 32, Math.PI]} />
        <meshBasicMaterial color="#06061c" toneMapped={false} />
      </mesh>
    </group>
  )
}
