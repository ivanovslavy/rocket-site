import type { MoonFact } from '../copy'
import { KeyedIcon } from '../components/icons'

/**
 * Foreground carded fact tooltip for a tokenomics moon. High-contrast glass
 * card; rendered via drei <Html> at the moon's projected screen position.
 */
export function MoonTooltip({
  fact,
  pinned,
}: {
  fact: MoonFact
  pinned: boolean
}) {
  return (
    <div
      className={`glass-card rounded-xl px-4 py-3 text-center whitespace-nowrap select-none ${
        pinned ? 'ring-2 ring-rocket-cyan' : ''
      }`}
    >
      <div className="flex items-center justify-center gap-2 text-sm font-semibold tracking-wide text-rocket-cyan">
        <KeyedIcon name={fact.icon} className="h-4 w-4" />
        {fact.label}
      </div>
      <div className="mt-0.5 font-display text-lg font-bold text-white">{fact.value}</div>
      {pinned && (
        <div className="mt-1 text-xs text-white/50">pinned · click to close</div>
      )}
    </div>
  )
}
