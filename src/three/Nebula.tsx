import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD_HEIGHT } from './flightPath'

/**
 * Procedural nebula clouds — the main "filler light" that turns dark space
 * from a black void into a rich, colorful, telescope-like field. Soft,
 * low-opacity colored fbm clouds (violet / teal / pink / blue) on deep
 * layers, plus a non-black base gradient so the background is never flat #000.
 */
const nebulaVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const nebulaFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uSeed;

  // hash + value noise + fbm
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i+vec2(0,0)), hash(i+vec2(1,0)), u.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0; float a = 0.5;
    for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  void main(){
    vec2 p = vUv * 3.2 + uSeed;
    float t = uTime * 0.015;
    float n = fbm(p + vec2(t, -t*0.6));
    n = pow(n, 1.7);
    // soft falloff toward the plane edges so clouds blend into the dark
    vec2 c = vUv - 0.5;
    float edge = smoothstep(0.55, 0.1, length(c));
    vec3 col = mix(uColorA, uColorB, fbm(p*0.7 + 4.0));
    float intensity = n * edge;
    gl_FragColor = vec4(col * intensity * 0.9, intensity * 0.45);
  }
`

interface CloudDef {
  pos: [number, number, number]
  scale: [number, number]
  a: string
  b: string
  seed: number
}

function NebulaCloud({ def }: { def: CloudDef }) {
  const mat = useRef<THREE.ShaderMaterial>(null!)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color(def.a) },
      uColorB: { value: new THREE.Color(def.b) },
      uSeed: { value: def.seed },
    }),
    [def],
  )
  useFrame((s) => {
    if (mat.current) mat.current.uniforms.uTime.value = s.clock.elapsedTime
  })
  return (
    <mesh position={def.pos} scale={[def.scale[0], def.scale[1], 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={nebulaVertex}
        fragmentShader={nebulaFragment}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  )
}

export function Nebula({ lite = false }: { lite?: boolean }) {
  const clouds = useMemo<CloudDef[]>(() => {
    const defs: CloudDef[] = []
    // blue/teal-leaning accents (no dominant purple) over the dark base
    const palettes: [string, string][] = [
      ['#2a6cff', '#16e0c0'], // blue → teal
      ['#1f8a8a', '#2a6cff'], // teal → blue
      ['#1f6fae', '#16e0c0'], // blue → teal
      ['#c23a8e', '#2a6cff'], // subtle pink → blue
    ]
    const n = lite ? 6 : 10
    for (let i = 0; i < n; i++) {
      // spread from the very top to the bottom so the fill is always present
      const y = -((i + 0.2) / n) * (WORLD_HEIGHT + 16) + 6
      const pal = palettes[i % palettes.length]
      defs.push({
        pos: [(i % 2 === 0 ? -1 : 1) * (2 + (i % 3) * 2), y, -20 - (i % 3) * 4],
        scale: [44 + (i % 3) * 10, 34 + (i % 2) * 12],
        a: pal[0],
        b: pal[1],
        seed: i * 13.7,
      })
    }
    return defs
  }, [lite])

  return (
    <group>
      {/* non-black deep base gradient plane, far behind everything */}
      <mesh position={[0, -WORLD_HEIGHT / 2, -40]} scale={[260, WORLD_HEIGHT + 60, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          vertexShader={`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
          fragmentShader={`
            varying vec2 vUv;
            void main(){
              // dark navy base by default — only a faint, not-purple tonal shift
              vec3 top = vec3(0.022, 0.026, 0.055);
              vec3 mid = vec3(0.012, 0.014, 0.032);
              vec3 bot = vec3(0.028, 0.026, 0.05);
              vec3 col = mix(top, mid, smoothstep(0.0,0.5,vUv.y));
              col = mix(col, bot, smoothstep(0.5,1.0,vUv.y));
              col += 0.008 * sin(vUv.x * 6.2831);
              gl_FragColor = vec4(col, 1.0);
            }
          `}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {clouds.map((def, i) => (
        <NebulaCloud key={i} def={def} />
      ))}
    </group>
  )
}
