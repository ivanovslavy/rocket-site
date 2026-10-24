import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Outlines } from '@react-three/drei'
import { ClickableHalo } from './ClickableHalo'
import { Moon } from './Moon'
import { MOON_FACTS } from '../copy'
import { TOKENOMICS_ANCHOR } from './flightPath'

const MOON_COLORS = [
  '#34e0ff',
  '#ff5cc8',
  '#ffd23f',
  '#4dffb0',
  '#a86bff',
  '#ff8a3d',
]

/**
 * The big feature planet placed early in the scroll. It is itself clickable-
 * looking (carries a halo) and hosts the orbiting clickable moons that each
 * hold one tokenomics fact.
 */
export function TokenomicsPlanet() {
  const planet = useRef<THREE.Mesh>(null!)
  const ring = useRef<THREE.Mesh>(null!)
  const mat = useRef<THREE.MeshToonMaterial>(null!)
  const { position, radius } = TOKENOMICS_ANCHOR

  useFrame((state, delta) => {
    if (planet.current) planet.current.rotation.y += delta * 0.08
    if (ring.current) ring.current.rotation.z += delta * 0.04
    if (mat.current) {
      const flicker = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 1.2)
      mat.current.emissiveIntensity = 0.18 + flicker * 0.18
    }
  })

  return (
    <group position={position}>
      <ClickableHalo radius={radius} color="#a86bff" speed={1.2} />

      {/* the planet itself */}
      <mesh ref={planet}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshToonMaterial ref={mat} color="#7b4dff" emissive="#7b4dff" emissiveIntensity={0.18} />
        <Outlines thickness={5} color="#06061c" />
      </mesh>

      {/* decorative banded ring */}
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[radius * 1.5, radius * 0.08, 16, 80]} />
        <meshToonMaterial color="#ffd23f" />
      </mesh>

      {/* orbiting clickable moons — one fact each */}
      {MOON_FACTS.map((fact, i) => (
        <Moon
          key={fact.id}
          fact={fact}
          orbitRadius={radius * (1.4 + i * 0.3)}
          speed={0.18 + i * 0.015}
          phase={(i / MOON_FACTS.length) * Math.PI * 2}
          size={0.6}
          color={MOON_COLORS[i % MOON_COLORS.length]}
        />
      ))}
    </group>
  )
}
