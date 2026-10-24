import { Suspense, useRef } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Loader } from '@react-three/drei'
import { Scene } from './three/Scene'
import { Content } from './sections/Content'
import { LorePanel } from './sections/LorePanel'
import { FeaturePanel } from './sections/FeaturePanel'
import { MoonTooltipOverlay } from './sections/MoonTooltipOverlay'
import { useScrollProgress } from './scroll'
import { ui, useUI } from './store'
import { RocketIcon, BoltIcon } from './components/icons'

export default function App() {
  const lite = useUI((s) => s.lite)
  useScrollProgress()
  const rootRef = useRef<HTMLDivElement>(null)

  return (
    <div ref={rootRef}>
      {/* 3D canvas sits BEHIND everything (lowest z). R3F listens for pointer
          events on the root (eventSource) so planets/moons stay clickable through
          the pointer-events-none gaps in the content. Planet hovers are ignored
          while a mouse button is held, so dragging to select text never triggers
          them (see the buttons check in Planet/Scene/Moon). */}
      <div className="fixed inset-0 -z-10">
        <Suspense fallback={null}>
          <Scene eventSource={rootRef} />
        </Suspense>
      </div>

      {/* always-foreground top bar */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 py-3 sm:px-6">
        <a
          href="#top"
          className="flex items-center gap-2 font-display text-xl font-extrabold text-white text-glow"
        >
          <RocketIcon className="h-6 w-6 text-rocket-cyan" />
          <span>$ROCKET</span>
        </a>

        <div className="flex items-center gap-2">
          <button
            onClick={() => ui.setLite(!lite)}
            title="Toggle Lite mode (drops particles + glow for weak devices)"
            className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold ring-1 backdrop-blur transition-colors ${
              lite
                ? 'bg-rocket-yellow/30 text-rocket-yellow ring-rocket-yellow/50'
                : 'bg-space-700/70 text-white/80 ring-white/20 hover:bg-space-600/70'
            }`}
          >
            <BoltIcon className="h-3.5 w-3.5" />
            {lite ? 'Lite: ON' : 'Lite'}
          </button>
          <ConnectButton
            showBalance={false}
            accountStatus="avatar"
            chainStatus="none"
            label="Connect"
          />
        </div>
      </header>

      {/* HTML content — normal DOM (full React context), foreground (z-10).
          The wrapper is pointer-events-none so clicks fall through to the 3D
          planets; cards/buttons re-enable pointer events themselves. */}
      <div id="top" className="pointer-events-none relative z-10">
        <Content />
      </div>

      {/* overlays — only visible when a planet/moon is interacted with */}
      <LorePanel />
      <FeaturePanel />
      <MoonTooltipOverlay />

      {/* themed loading screen while the 3D scene boots */}
      <Loader
        containerStyles={{ background: '#06061c' }}
        barStyles={{ background: 'linear-gradient(90deg,#34e0ff,#a86bff)' }}
        dataStyles={{ color: '#9cc4ff', fontFamily: 'Baloo 2, sans-serif' }}
        dataInterpolation={(p) => `Fueling the rocket… ${p.toFixed(0)}%`}
      />
    </div>
  )
}
