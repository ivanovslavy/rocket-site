import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD_HEIGHT } from './flightPath'

/**
 * Realistic, telescope-like starfield: several depth layers of instanced
 * points with varied size + brightness + gentle twinkle. Layers parallax at
 * different speeds (deeper = slower) to sell depth. This is the sparkle that
 * keeps the dark field alive.
 */
const starVertex = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vColor = aColor;
    vTwinkle = 0.55 + 0.45 * sin(uTime * 1.4 + aPhase);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (420.0 / -mv.z);
  }
`

const starFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float core = smoothstep(0.5, 0.0, d);
    float glow = smoothstep(0.5, 0.15, d) * 0.5;
    float a = (core + glow) * vTwinkle;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * (1.0 + vTwinkle * 0.6), a);
  }
`

const STAR_PALETTE = [
  new THREE.Color('#ffffff'),
  new THREE.Color('#bcd4ff'),
  new THREE.Color('#fff3c4'),
  new THREE.Color('#ffd0e8'),
  new THREE.Color('#c4f0ff'),
]

function StarLayer({
  count,
  spread,
  depth,
  sizeScale,
  parallax,
}: {
  count: number
  spread: number
  depth: number
  sizeScale: number
  parallax: number
}) {
  const ref = useRef<THREE.Points>(null!)
  const mat = useRef<THREE.ShaderMaterial>(null!)

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const phase = new Float32Array(count)
    const color = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread
      pos[i * 3 + 1] = -Math.random() * (WORLD_HEIGHT + 30) + 15
      pos[i * 3 + 2] = depth + (Math.random() - 0.5) * 6
      size[i] = (0.4 + Math.random() * Math.random() * 2.6) * sizeScale
      phase[i] = Math.random() * Math.PI * 2
      const c = STAR_PALETTE[(Math.random() * STAR_PALETTE.length) | 0]
      color[i * 3] = c.r
      color[i * 3 + 1] = c.g
      color[i * 3 + 2] = c.b
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    g.setAttribute('aColor', new THREE.BufferAttribute(color, 3))
    return g
  }, [count, spread, depth, sizeScale])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.5) },
    }),
    [],
  )

  useFrame((state) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime
    if (ref.current) {
      // subtle parallax drift relative to the camera
      ref.current.position.y = state.camera.position.y * parallax
    }
  })

  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={starVertex}
        fragmentShader={starFragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export function Starfield({ lite = false }: { lite?: boolean }) {
  const m = lite ? 0.4 : 1
  // wide spreads so the field fills the viewport edge-to-edge on any aspect
  return (
    <group>
      <StarLayer count={Math.round(2600 * m)} spread={95} depth={-30} sizeScale={1.7} parallax={0.04} />
      <StarLayer count={Math.round(2000 * m)} spread={76} depth={-20} sizeScale={1.25} parallax={0.1} />
      <StarLayer count={Math.round(1400 * m)} spread={60} depth={-12} sizeScale={1.0} parallax={0.18} />
    </group>
  )
}
