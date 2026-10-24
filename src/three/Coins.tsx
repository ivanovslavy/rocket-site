import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ALL_PLANET_TARGETS, buildFlightPath } from './flightPath'
import type { useScrollVelocity } from '../hooks/useScrollVelocity'

type ScrollState = ReturnType<typeof useScrollVelocity>

interface Coin {
  alive: boolean
  pos: THREE.Vector3
  vel: THREE.Vector3
  target: THREE.Vector3
  spin: number
  scale: number
  popping: boolean
}

/**
 * $ROCKET coins the rocket jettisons as it flies. One InstancedMesh for the
 * whole pool (perf). Each live coin is gravitationally pulled toward the
 * nearest planet and gets "absorbed" — a little scale-up pop, then scale to 0
 * — when it arrives, after which it's recycled.
 */
export function Coins({
  scroll,
  lite = false,
}: {
  scroll: ScrollState
  lite?: boolean
}) {
  const COUNT = lite ? 14 : 40
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const curve = useMemo(() => buildFlightPath(), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const rocketPos = useMemo(() => new THREE.Vector3(), [])
  const spawnTimer = useRef(0)

  const coins = useMemo<Coin[]>(
    () =>
      Array.from({ length: COUNT }, () => ({
        alive: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        target: new THREE.Vector3(),
        spin: 0,
        scale: 1,
        popping: false,
      })),
    [COUNT],
  )

  const nearestPlanet = (p: THREE.Vector3): THREE.Vector3 => {
    let best = ALL_PLANET_TARGETS[0]
    let bestD = Infinity
    for (const pl of ALL_PLANET_TARGETS) {
      const d =
        (pl.position[0] - p.x) ** 2 +
        (pl.position[1] - p.y) ** 2 +
        (pl.position[2] - p.z) ** 2
      if (d < bestD) {
        bestD = d
        best = pl
      }
    }
    return new THREE.Vector3(...best.position)
  }

  useFrame((_, delta) => {
    const offset = THREE.MathUtils.clamp(scroll.offset.current, 0, 1)
    curve.getPointAt(offset, rocketPos)

    // periodically jettison a coin while moving through the cosmos
    spawnTimer.current += delta
    const interval = 0.55
    if (spawnTimer.current > interval) {
      spawnTimer.current = 0
      const free = coins.find((c) => !c.alive)
      if (free) {
        free.alive = true
        free.popping = false
        free.scale = 1
        free.spin = Math.random() * Math.PI * 2
        free.pos.copy(rocketPos).add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 0.6,
            -0.8 - Math.random() * 0.4,
            (Math.random() - 0.5) * 0.6,
          ),
        )
        // initial toss velocity
        free.vel.set(
          (Math.random() - 0.5) * 2,
          -1 - Math.random(),
          (Math.random() - 0.5) * 2,
        )
        free.target.copy(nearestPlanet(free.pos))
      }
    }

    for (let i = 0; i < coins.length; i++) {
      const c = coins[i]
      if (!c.alive) {
        dummy.position.set(0, 9999, 0) // park offscreen
        dummy.scale.setScalar(0.0001)
        dummy.updateMatrix()
        mesh.current.setMatrixAt(i, dummy.matrix)
        continue
      }

      if (!c.popping) {
        // gravitational attraction toward the target planet
        const dir = c.target.clone().sub(c.pos)
        const dist = dir.length()
        dir.normalize()
        const g = 9 / Math.max(dist * dist, 0.6)
        c.vel.addScaledVector(dir, g * delta)
        c.vel.multiplyScalar(0.99)
        c.pos.addScaledVector(c.vel, delta)
        c.spin += delta * 6

        if (dist < 1.0) {
          c.popping = true // reached the planet — start the absorb pop
        }
      } else {
        // little pop: brief scale-up then shrink to 0, then recycle
        c.scale += delta * (c.scale < 1.4 ? 4 : -6)
        c.spin += delta * 10
        if (c.scale <= 0.05) {
          c.alive = false
        }
      }

      dummy.position.copy(c.pos)
      dummy.rotation.set(Math.PI / 2, c.spin, 0)
      dummy.scale.setScalar(0.22 * c.scale)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, COUNT]}
      frustumCulled={false}
    >
      <cylinderGeometry args={[1, 1, 0.18, 24]} />
      <meshStandardMaterial
        color="#ffd23f"
        emissive="#ff8a3d"
        emissiveIntensity={0.55}
        metalness={0.6}
        roughness={0.25}
        toneMapped={false}
      />
    </instancedMesh>
  )
}
