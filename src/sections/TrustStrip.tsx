import { TRUST_STRIP } from '../copy'
import { CheckIcon } from '../components/icons'

/** "No B.S." trust strip — the honest one-liners, side by side. */
export function TrustStrip() {
  return (
    <div className="pointer-events-auto mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3">
      {TRUST_STRIP.map((item) => (
        <span
          key={item}
          className="flex items-center gap-1.5 rounded-full bg-space-700/70 px-4 py-2 text-sm font-semibold text-white ring-1 ring-rocket-green/40 backdrop-blur"
        >
          <CheckIcon className="h-4 w-4 text-rocket-green" />
          {item}
        </span>
      ))}
    </div>
  )
}
