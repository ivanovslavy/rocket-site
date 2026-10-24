import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Billboard } from '@react-three/drei'

/**
 * The "you can click me" cue: a GENTLE soft glow that lightly flickers around
 * an interactive object — not a big ring. Paired with an emissive pulse on the
 * object itself (handled by the planet/moon), so the whole body softly lights
 * up as it flickers. A pinned/clicked object stays lit (steady, brighter).
 *
 * Decorative objects must NOT render this.
 */
const glowTexture = makeRadialTexture()

export function ClickableHalo({
  radius,
  color = '#34e0ff',
  speed = 1.4,
  lit = false,
}: {
  radius: number
  color?: string
  speed?: number
  lit?: boolean
}) {
  const mat = useRef<THREE.SpriteMaterial>(null!)
  const sprite = useRef<THREE.Sprite>(null!)
  const phase = useRef(Math.random() * Math.PI * 2)

  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + phase.current
    const flicker = 0.5 + 0.5 * Math.sin(t)
    if (mat.current) {
      // clearly visible soft blinking glow (not a hard ring)
      const base = lit ? 0.7 : 0.45
      const amp = lit ? 0.18 : 0.35
      mat.current.opacity = base + flicker * amp
    }
    if (sprite.current) {
      // soft glow hugging the body, gently breathing
      const s = radius * (lit ? 2.3 : 1.9 + flicker * 0.3)
      sprite.current.scale.set(s, s, s)
    }
  })

  return (
    <Billboard>
      <sprite ref={sprite}>
        <spriteMaterial
          ref={mat}
          map={glowTexture}
          color={color}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
    </Billboard>
  )
}

function makeRadialTexture(): THREE.Texture {
  const size = 128
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  // soft, feathered glow (no hard ring)
  g.addColorStop(0, 'rgba(255,255,255,0.9)')
  g.addColorStop(0.45, 'rgba(255,255,255,0.35)')
  g.addColorStop(0.75, 'rgba(255,255,255,0.08)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}
