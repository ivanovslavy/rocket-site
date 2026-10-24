import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Outlines } from '@react-three/drei'
import { buildFlightPath, landingFactor } from './flightPath'
import type { useScrollVelocity } from '../hooks/useScrollVelocity'

type ScrollState = ReturnType<typeof useScrollVelocity>

/**
 * Toon rocket built from primitives (no model files). Follows the authored
 * spline by scroll.offset, weaves on the z-axis, tilts + flares thrusters with
 * scroll velocity, and slows/orients/pauses in landing zones before lifting
 * off. Lives on a z-plane in front of the planets but behind the HTML layer.
 */
export function Rocket({
  scroll,
  lite = false,
}: {
  scroll: ScrollState
  lite?: boolean
}) {
  const group = useRef<THREE.Group>(null!)
  const flameLow = useRef<THREE.Mesh>(null!)
  const flameHigh = useRef<THREE.Mesh>(null!)
  const light = useRef<THREE.PointLight>(null!)
  const plume = useRef<THREE.Points>(null!)

  const curve = useMemo(() => buildFlightPath(), [])
  const tmpPos = useMemo(() => new THREE.Vector3(), [])
  const tmpTan = useMemo(() => new THREE.Vector3(), [])
  const travelDir = useMemo(() => new THREE.Vector3(0, -1, 0), [])
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const targetQ = useMemo(() => new THREE.Quaternion(), [])
  const bankQ = useMemo(() => new THREE.Quaternion(), [])
  const lastOffset = useRef(0)
  const dirSign = useRef(1) // +1 scrolling down, -1 scrolling up

  // small particle plume behind the nozzle
  const plumeGeo = useMemo(() => {
    const n = lite ? 16 : 40
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      p[i * 3] = (Math.random() - 0.5) * 0.25
      p[i * 3 + 1] = -0.9 - Math.random() * 1.6
      p[i * 3 + 2] = (Math.random() - 0.5) * 0.25
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    return g
  }, [lite])

  useFrame((state, delta) => {
    const offset = THREE.MathUtils.clamp(scroll.offset.current, 0, 1)
    const vel = scroll.velocity.current
    const landing = landingFactor(offset)

    // track scroll direction so the NOSE always leads the way we travel
    const d = offset - lastOffset.current
    if (Math.abs(d) > 1e-5) dirSign.current = d > 0 ? 1 : -1
    lastOffset.current = offset

    // position + unit tangent along the spline (tangent points toward +offset)
    curve.getPointAt(offset, tmpPos)
    curve.getTangentAt(offset, tmpTan)

    if (group.current) {
      group.current.position.copy(tmpPos)

      // travel direction = tangent flipped by scroll sign (nose-forward both ways)
      travelDir.copy(tmpTan).multiplyScalar(dirSign.current).normalize()
      // align the model's nose (local +Y) to the travel direction
      targetQ.setFromUnitVectors(up, travelDir)
      // subtle banking roll from the horizontal travel component
      const bank = THREE.MathUtils.clamp(travelDir.x * 0.5, -0.4, 0.4)
      bankQ.setFromAxisAngle(travelDir, -bank)
      targetQ.premultiply(bankQ)

      group.current.quaternion.slerp(targetQ, Math.min(delta * 4, 1))

      // gentle idle bob while landed
      if (landing > 0.5) {
        group.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.05
      }
    }

    // thruster intensity: reactive to scroll speed, plus a burst on liftoff
    const liftoff = landing > 0.3 ? landing * 0.6 : 0
    const intensity = THREE.MathUtils.clamp(0.25 + vel * 1.8 + liftoff, 0.2, 2.2)
    const flicker = 0.85 + Math.sin(state.clock.elapsedTime * 30) * 0.15

    if (flameLow.current) {
      flameLow.current.scale.set(1, intensity * flicker, 1)
      ;(flameLow.current.material as THREE.MeshBasicMaterial).opacity = 0.9
    }
    if (flameHigh.current) {
      flameHigh.current.scale.set(1, intensity * flicker * 0.6, 1)
    }
    if (light.current) {
      light.current.intensity = intensity * 6
      light.current.distance = 8 + intensity * 4
    }
    if (plume.current) {
      ;(plume.current.material as THREE.PointsMaterial).size =
        0.12 + intensity * 0.06
      plume.current.scale.set(1, 0.6 + intensity, 1)
    }
  })

  return (
    <group ref={group}>
      {/* nose cone */}
      <mesh position={[0, 1.15, 0]}>
        <coneGeometry args={[0.42, 0.9, 24]} />
        <ToonMat color="#ff5cc8" />
        <Outlines thickness={3} color="#06061c" />
      </mesh>
      {/* body */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 1.8, 28]} />
        <ToonMat color="#f5f3ff" />
        <Outlines thickness={3} color="#06061c" />
      </mesh>
      {/* window */}
      <mesh position={[0, 0.6, 0.46]}>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial
          color="#34e0ff"
          emissive="#0a6c8c"
          emissiveIntensity={0.6}
          metalness={0.1}
          roughness={0.2}
        />
      </mesh>
      {/* fins */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.5, -0.55, 0]} rotation={[0, 0, s * -0.5]}>
          <coneGeometry args={[0.28, 0.9, 4]} />
          <ToonMat color="#34e0ff" />
          <Outlines thickness={3} color="#06061c" />
        </mesh>
      ))}
      <mesh position={[0, -0.55, 0.5]} rotation={[-0.5, 0, 0]}>
        <coneGeometry args={[0.26, 0.85, 4]} />
        <ToonMat color="#34e0ff" />
        <Outlines thickness={3} color="#06061c" />
      </mesh>
      {/* nozzle */}
      <mesh position={[0, -0.78, 0]}>
        <cylinderGeometry args={[0.34, 0.46, 0.35, 20]} />
        <ToonMat color="#6b6890" />
      </mesh>

      {/* thruster flames (emissive cones, bloom-friendly) */}
      <mesh ref={flameHigh} position={[0, -1.25, 0]}>
        <coneGeometry args={[0.22, 1.0, 16]} />
        <meshBasicMaterial
          color="#fff3a0"
          transparent
          opacity={0.95}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={flameLow} position={[0, -1.45, 0]}>
        <coneGeometry args={[0.36, 1.6, 18]} />
        <meshBasicMaterial
          color="#ff8a3d"
          transparent
          opacity={0.85}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <points ref={plume} geometry={plumeGeo} position={[0, -1.0, 0]}>
        <pointsMaterial
          color="#ffb13d"
          size={0.14}
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>

      <pointLight
        ref={light}
        position={[0, -1.3, 0.4]}
        color="#ff9a3d"
        intensity={6}
        distance={10}
      />
    </group>
  )
}

/** Toon material for the banded childlike look. */
function ToonMat({ color }: { color: string }) {
  return <meshToonMaterial color={color} />
}
