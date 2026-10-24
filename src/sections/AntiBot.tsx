import { ANTIBOT } from '../copy'
import { ShieldIcon, EthIcon, SparkIcon } from '../components/icons'

/** Inner content for the Anti-Bot block — rendered inside the planet panel. */
export function AntiBotContent() {
  return (
    <div className="w-full">
      <div className="text-center">
        <h2 className="flex items-center justify-center gap-2 font-display text-3xl font-extrabold text-white heading-glow sm:text-4xl">
          <ShieldIcon className="h-8 w-8 text-rocket-cyan" />
          {ANTIBOT.title}
        </h2>
        <p className="mt-2 text-lg text-rocket-cyan text-glow">{ANTIBOT.subtitle}</p>
      </div>

      <p className="mt-5 leading-relaxed text-white/90">{ANTIBOT.intro}</p>

      <p className="mt-4 flex items-center gap-2 rounded-xl bg-rocket-violet/15 px-4 py-2.5 text-sm font-semibold text-white/85 ring-1 ring-rocket-violet/30">
        <EthIcon className="h-4 w-4 shrink-0 text-rocket-cyan" />
        {ANTIBOT.chainNote}
      </p>

      <div className="mt-5 space-y-2">
        {ANTIBOT.tiers.map((t) => (
          <div
            key={t.window}
            className="grid grid-cols-1 gap-1 rounded-xl bg-space-700/60 px-4 py-3 ring-1 ring-white/10 sm:grid-cols-3 sm:items-center sm:gap-3"
          >
            <span className="font-display text-sm font-bold text-rocket-cyan">{t.window}</span>
            <span className="text-sm text-white/80">{t.wallet}</span>
            <span className="text-sm font-semibold text-rocket-pink sm:text-right">{t.tax}</span>
          </div>
        ))}
      </div>

      <ul className="mt-5 space-y-2">
        {ANTIBOT.notes.map((n) => (
          <li key={n} className="flex items-start gap-2 text-sm leading-relaxed text-white/75">
            <SparkIcon className="mt-0.5 h-4 w-4 shrink-0 text-rocket-yellow" />
            <span>{n}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
