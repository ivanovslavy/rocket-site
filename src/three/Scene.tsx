import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr, Outlines } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

import { Starfield } from './Starfield'
import { Nebula } from './Nebula'
import { Rocket } from './Rocket'
import { Planet } from './Planet'
import { TokenomicsPlanet } from './TokenomicsPlanet'
import { ClickableHalo } from './ClickableHalo'
import { CAMERA_Z, DECOR_ANCHORS, FEATURE_ANCHORS, LORE_ANCHORS, yAt } from './flightPath'
import { useScrollVelocity } from '../hooks/useScrollVelocity'
import { scrollState } from '../scroll'
import { ui, useUI } from '../store'

const LORE_COLORS: Record<string, { color: string; halo: string }> = {
  origin: { color: '#4dffb0', halo: '#4dffb0' },
  crew: { color: '#ff5cc8', halo: '#ff8af0' },
  horizon: { color: '#34e0ff', halo: '#7ce8ff' },
}

// Per-planet spin (rad/s) + starting angle so every smiley planet rotates its
// own way — different speeds AND directions, offset so they never line up.
const LORE_SPIN: Record<string, { spin: number; angle: number }> = {
  origin: { spin: 0.1, angle: 0.4 },
  crew: { spin: -0.13, angle: 2.1 },
  horizon: { spin: 0.16, angle: 3.7 },
}
const FEATURE_SPIN: Record<string, { spin: number; angle: number }> = {
  mission: { spin: -0.09, angle: 1.2 },
  tokenomics: { spin: 0.14, angle: 2.8 },
  antibot: { spin: -0.17, angle: 0.6 },
  howtobuy: { spin: 0.11, angle: 4.5 },
}

/** All 3D content; drives the camera from the shared scroll state. */
function SceneContents() {
  const scroll = useScrollVelocity()
  const reduced = useUI((s) => s.reducedMotion)
  const lite = useUI((s) => s.lite)

  useFrame((state, delta) => {
    // fly the camera down the finite column of planets
    const targetY = yAt(scrollState.offset)
    state.camera.position.y = THREE.MathUtils.damp(
      state.camera.position.y,
      targetY,
      8,
      delta,
    )
    if (!reduced) {
      state.camera.position.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.4
    }
    state.camera.lookAt(0, state.camera.position.y, 0)
  })

  return (
    <>
      <Nebula lite={lite} />
      <Starfield lite={lite} />

      <TokenomicsPlanet />

      {LORE_ANCHORS.map((a) => (
        <Planet
          key={a.id}
          id={a.id}
          position={a.position}
          radius={a.radius}
          color={LORE_COLORS[a.id].color}
          haloColor={LORE_COLORS[a.id].halo}
          spin={LORE_SPIN[a.id].spin}
          initialAngle={LORE_SPIN[a.id].angle}
        />
      ))}

      <DecorPlanets />
      <FeaturePlanets />

      <Rocket scroll={scroll} lite={lite} />
    </>
  )
}

/** Glowing clickable planets that open the Mission / Tokenomics / How-to-Buy blocks. */
function FeaturePlanets() {
  return (
    <>
      {FEATURE_ANCHORS.map((a) => (
        <FeaturePlanet
          key={a.id}
          feature={a.feature}
          position={a.position}
          radius={a.radius}
          color={a.color}
          spin={FEATURE_SPIN[a.feature].spin}
          initialAngle={FEATURE_SPIN[a.feature].angle}
        />
      ))}
    </>
  )
}

function FeaturePlanet({
  feature,
  position,
  radius,
  color,
  spin,
  initialAngle,
}: {
  feature: string
  position: [number, number, number]
  radius: number
  color: string
  spin: number
  initialAngle: number
}) {
  const group = useRef<THREE.Group>(null!)
  const planet = useRef<THREE.Mesh>(null!)
  const mat = useRef<THREE.MeshToonMaterial>(null!)
  const [hovered, setHovered] = useState(false)
  const pinned = useUI((s) => s.featurePinned === feature)
  const open = pinned || hovered
  useFrame((state, delta) => {
    if (group.current) {
      // Rotate the whole group so the smiley face spins with the planet (a solid
      // sphere alone shows no visible motion). Each planet uses its own signed
      // speed so they all rotate differently, never in lock-step.
      group.current.rotation.y += delta * spin
      const target = pinned ? 1.12 : hovered ? 1.06 : 1
      const s = THREE.MathUtils.damp(group.current.scale.x, target, 6, delta)
      group.current.scale.setScalar(s)
    }
    if (mat.current) {
      const flicker = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 1.4)
      const base = pinned ? 0.7 : hovered ? 0.55 : 0.3
      mat.current.emissiveIntensity = base + flicker * 0.35
    }
  })
  return (
    <group position={position}>
      <ClickableHalo radius={radius} color={color} speed={1.3} lit={open} />
      <group
        ref={group}
        rotation={[0, initialAngle, 0]}
        onPointerOver={(e) => {
          if ((e.nativeEvent?.buttons ?? 0) !== 0) return // drag/selection, not a hover
          e.stopPropagation()
          setHovered(true)
          ui.hoverFeature(feature)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          ui.hoverFeature(null)
          document.body.style.cursor = 'auto'
        }}
        onClick={(e) => {
          e.stopPropagation()
          ui.clickFeature(feature)
        }}
      >
        <mesh ref={planet}>
          <sphereGeometry args={[radius, 48, 48]} />
          <meshToonMaterial ref={mat} color={color} emissive={color} emissiveIntensity={0.3} />
          <Outlines thickness={4} color="#06061c" />
        </mesh>
        <FeatureFace radius={radius} />
      </group>
    </group>
  )
}

/** simple smiley so feature planets read as friendly, clickable toon planets */
function FeatureFace({ radius }: { radius: number }) {
  const z = radius * 0.92
  return (
    <group position={[0, 0, z]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * radius * 0.3, radius * 0.18, 0]}>
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

function DecorPlanets() {
  const colors = ['#ff8a3d', '#7b4dff', '#16e0c0', '#ffd23f', '#ff5cc8', '#34e0ff']
  return (
    <>
      {DECOR_ANCHORS.map((a, i) => (
        <DecorPlanet
          key={a.id}
          position={a.position}
          radius={a.radius}
          color={colors[i % colors.length]}
        />
      ))}
    </>
  )
}

function DecorPlanet({
  position,
  radius,
  color,
}: {
  position: [number, number, number]
  radius: number
  color: string
}) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshToonMaterial color={color} />
    </mesh>
  )
}

export function Scene({
  eventSource,
}: {
  eventSource?: React.RefObject<HTMLElement | null>
}) {
  const lite = useUI((s) => s.lite)
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, CAMERA_Z], fov: 52, near: 0.1, far: 200 }}
      // listen for pointer events on the top-level root (the 3D canvas sits behind
      // the HTML), using client coords so planets stay clickable through the
      // pointer-events-none gaps. Planet hovers are skipped while a mouse button is
      // held (text-selection drag), so HTML interaction is never hijacked.
      eventSource={
        (eventSource ?? undefined) as React.RefObject<HTMLElement> | undefined
      }
      eventPrefix="client"
      onPointerMissed={() => ui.pinMoon(null)}
    >
      <color attach="background" args={['#06061c']} />
      <fog attach="fog" args={['#06061c', 22, 60]} />

      <ambientLight intensity={0.85} />
      <hemisphereLight args={['#9cc4ff', '#2a1a55', 0.6]} />
      <directionalLight position={[5, 6, 8]} intensity={1.1} color="#fff3e0" />
      <pointLight position={[-8, -4, 6]} intensity={0.6} color="#ff5cc8" />

      <Suspense fallback={null}>
        <SceneContents />
      </Suspense>

      {!lite && (
        <EffectComposer>
          <Bloom
            intensity={0.9}
            luminanceThreshold={0.35}
            luminanceSmoothing={0.5}
            mipmapBlur
          />
        </EffectComposer>
      )}
      <AdaptiveDpr pixelated />
    </Canvas>
  )
}
