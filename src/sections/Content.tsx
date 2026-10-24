import { Hero } from './Hero'
import { SwapTerminal } from './SwapTerminal'
import { Footer } from './Footer'
import { PlanetIcon, SparkIcon } from '../components/icons'

/**
 * The HTML content layer. Hero, the tokenomics-intro guide, the Swap terminal
 * and the Footer are always visible. Everything else — the lore chapters and
 * the Mission / Tokenomics / How-to-Buy blocks — is HIDDEN and opens only when
 * its glowing planet is clicked (LorePanel / FeaturePanel). The empty spacers
 * keep the scroll length so each planet sits at the right point.
 */
export function Content() {
  return (
    <main className="pointer-events-none w-full text-white">
      {/* 1 · Hero */}
      <Hero />

      {/* 2 · Tokenomics planet — moons hold the facts (interact in 3D) */}
      <section className="relative flex min-h-screen items-center justify-start px-4">
        <div className="pointer-events-auto glass-card max-w-md rounded-3xl p-7">
          <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-rocket-cyan">
            Tokenomics
          </p>
          <h2 className="mt-2 flex items-center gap-2 font-display text-4xl font-extrabold text-white heading-glow">
            The facts orbit here
            <PlanetIcon className="h-8 w-8 text-rocket-violet" />
          </h2>
          <p className="mt-3 leading-relaxed text-white/85">
            That glowing planet to the side carries six little moons. Each one
            holds a hard fact about $ROCKET. <span className="text-rocket-cyan">Hover</span> a
            moon to peek, <span className="text-rocket-cyan">click</span> it to pin the fact.
            Everything is honest, on-chain, and final.
          </p>
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-rocket-cyan/10 px-4 py-3 text-sm font-semibold text-rocket-cyan ring-1 ring-rocket-cyan/30">
            <PlanetIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Scroll down and click every glowing planet to unlock the real
              $ROCKET story, the mission, tokenomics, the anti-bot shield and
              how to buy.
            </span>
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-sm text-white/55">
            <SparkIcon className="h-4 w-4 text-rocket-yellow" />
            A blinking halo means “you can click me.”
          </p>
        </div>
      </section>

      {/* 3-5 · Lore chapters — open from the lore planets (LorePanel) */}
      <PlanetSpacer label="Planet Origin" />
      <PlanetSpacer label="Planet Crew" />
      <PlanetSpacer label="Planet Horizon" />

      {/* 6-9 · Mission / Tokenomics / Anti-Bot / How-to-Buy — open from their planets.
          The Anti-Bot shield planet (teal) sits between Tokenomics and How-to-Buy in
          3D (see FEATURE_ANCHORS) and opens from FeaturePanel like the rest. */}
      <PlanetSpacer label="The Mission — click the yellow planet" />
      <PlanetSpacer label="Tokenomics — click the pink planet" />
      <PlanetSpacer label="Anti-Bot Shield — click the teal planet" />
      <PlanetSpacer label="How to Buy — click the blue planet" />

      {/* 9 · Swap terminal (always visible) */}
      <SwapTerminal />

      {/* 10 · Footer */}
      <Footer />
    </main>
  )
}

/** A full-height, text-free scroll region aligned with a clickable planet. */
function PlanetSpacer({ label }: { label: string }) {
  return <section aria-label={label} className="min-h-screen" />
}
