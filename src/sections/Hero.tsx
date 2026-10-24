import { HERO } from '../copy'
import { EthIcon, ShieldIcon } from '../components/icons'

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="pointer-events-auto glass-card max-w-2xl rounded-3xl px-7 py-10 animate-float">
        <div className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold">
          <span className="flex items-center gap-1.5 rounded-full bg-rocket-violet/25 px-3 py-1 text-rocket-cyan ring-1 ring-rocket-violet/40">
            <EthIcon className="h-3.5 w-3.5" /> {HERO.chain}
          </span>
          <span className="rounded-full bg-rocket-pink/20 px-3 py-1 text-rocket-pink ring-1 ring-rocket-pink/40">
            Fair Launch
          </span>
        </div>
        <h1 className="font-display text-6xl font-extrabold tracking-tight text-white heading-glow sm:text-7xl">
          {HERO.ticker}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/90 text-glow sm:text-xl">
          {HERO.tagline}
        </p>
        <p className="mx-auto mt-6 flex max-w-xl items-start gap-2.5 rounded-2xl bg-rocket-cyan/10 px-5 py-4 text-left text-sm leading-relaxed text-rocket-cyan ring-1 ring-rocket-cyan/30 sm:text-base">
          <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{HERO.shield}</span>
        </p>
      </div>
      <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 text-sm text-white/60 text-glow">
        scroll to launch ↓
      </div>
    </section>
  )
}
