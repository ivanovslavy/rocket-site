import { useState } from 'react'
import { TOKENOMICS } from '../copy'
import { CONTRACT_ADDRESS_DISPLAY } from '../links'
import { BanIcon, EthIcon } from '../components/icons'

/** Donut showing the honest truth: 100% Liquidity · 0% Team · 0% Presale. */
function Donut() {
  const r = 70
  const c = 2 * Math.PI * r
  // 100% liquidity → full ring
  return (
    <svg viewBox="0 0 180 180" className="h-44 w-44">
      <circle cx="90" cy="90" r={r} fill="none" stroke="#1c1850" strokeWidth="26" />
      <circle
        cx="90"
        cy="90"
        r={r}
        fill="none"
        stroke="#34e0ff"
        strokeWidth="26"
        strokeDasharray={`${c} ${c}`}
        strokeLinecap="round"
        transform="rotate(-90 90 90)"
      />
      <text x="90" y="84" textAnchor="middle" className="fill-white font-bold" style={{ fontSize: 26, fontFamily: 'Baloo 2' }}>
        100%
      </text>
      <text x="90" y="106" textAnchor="middle" className="fill-rocket-cyan" style={{ fontSize: 13 }}>
        Liquidity
      </text>
    </svg>
  )
}

/** Inner content for the Tokenomics block — rendered inside the planet panel. */
export function TokenomicsContent() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(CONTRACT_ADDRESS_DISPLAY).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      <div>
        <div className="text-center">
          <h2 className="font-display text-4xl font-extrabold text-white heading-glow">
            {TOKENOMICS.title}
          </h2>
          <p className="mt-2 text-lg text-rocket-cyan text-glow">{TOKENOMICS.subtitle}</p>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-2 md:items-center">
          <div className="flex flex-col items-center gap-4">
            <Donut />
            <div className="flex gap-4 text-sm">
              {TOKENOMICS.donut.map((d) => (
                <span key={d.label} className="flex items-center gap-1.5 text-white/80">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ background: d.color }} />
                  {d.value}% {d.label}
                </span>
              ))}
            </div>
            <p className="text-center text-sm leading-relaxed text-white/70">
              {TOKENOMICS.intro}
            </p>
          </div>

          <div className="space-y-2">
            {TOKENOMICS.facts.map((f) => (
              <div
                key={f.k}
                className="flex items-center justify-between gap-3 rounded-xl bg-space-700/60 px-4 py-2.5 ring-1 ring-white/10"
              >
                <span className="text-sm font-semibold text-white/70">{f.k}</span>
                <span className="text-right font-display text-sm font-bold text-white">{f.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* contract address + copy */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-space-900/70 px-4 py-2 ring-1 ring-rocket-violet/30">
            <span className="text-xs text-white/50">Contract</span>
            <code className="font-mono text-sm text-rocket-cyan">{CONTRACT_ADDRESS_DISPLAY}</code>
            <button
              onClick={copy}
              className="rounded-md bg-rocket-violet/30 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-rocket-violet/50"
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
          <span className="flex items-center gap-1.5 rounded-xl bg-space-700/60 px-4 py-2 text-sm font-semibold text-rocket-yellow ring-1 ring-rocket-yellow/30">
            $ROCKET · <EthIcon className="h-3.5 w-3.5" /> Ethereum
          </span>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-rocket-pink/10 px-4 py-3 text-center text-sm italic text-white/80 ring-1 ring-rocket-pink/30">
          <BanIcon className="h-4 w-4 shrink-0 text-rocket-pink" /> {TOKENOMICS.noRoadmap}
        </p>
      </div>
    </div>
  )
}
