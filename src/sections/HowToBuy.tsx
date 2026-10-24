import { HOW_TO_BUY } from '../copy'
import { KeyedIcon } from '../components/icons'

/** Inner content for the How-to-Buy block — rendered inside the planet panel. */
export function HowToBuyContent() {
  return (
    <div className="w-full">
      <h3 className="text-center font-display text-2xl font-extrabold text-white heading-glow">
        How to Buy
      </h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {HOW_TO_BUY.map((step) => (
          <div
            key={step.n}
            className="flex flex-col items-center gap-2 rounded-2xl bg-space-700/50 p-5 text-center ring-1 ring-white/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-rocket-cyan to-rocket-violet font-display text-xl font-extrabold text-space-900">
              {step.n}
            </div>
            <KeyedIcon name={step.icon} className="h-7 w-7 text-rocket-cyan" />
            <div className="font-display text-lg font-bold text-white">{step.title}</div>
            <p className="text-sm leading-snug text-white/75">{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
