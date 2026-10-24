import type { ReactElement } from 'react'
import type { IconKey } from '../copy'

/**
 * Themed cosmos/rocket SVG icons (no emoji). All use `currentColor` so Tailwind
 * text color controls them. A few animate themselves via inline SMIL.
 */
type IconProps = { className?: string }
const base = (className = '') => `inline-block ${className}`

/** Resolve a data-driven IconKey (from copy.ts) to its icon component. */
export function KeyedIcon({ name, className }: { name: IconKey; className?: string }) {
  const map: Record<IconKey, (p: IconProps) => ReactElement> = {
    coin: CoinIcon,
    droplet: DropletIcon,
    lock: LockIcon,
    ban: BanIcon,
    zerotax: ZeroTaxIcon,
    doc: ScrollDocIcon,
    eth: EthIcon,
    wallet: WalletIcon,
    swap: SwapIcon,
    gem: GemIcon,
  }
  const Cmp = map[name]
  return <Cmp className={className} />
}

/** Rocket with an animated flickering flame. */
export function RocketIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <path
        d="M12 2c3 2.2 4.5 5.5 4.5 9.5L14.5 16h-5L7.5 11.5C7.5 7.5 9 4.2 12 2Z"
        fill="currentColor"
        opacity="0.95"
      />
      <circle cx="12" cy="9" r="1.8" fill="#06061c" />
      <path d="M7.7 12 5 15l3-0.8ZM16.3 12 19 15l-3-0.8Z" fill="currentColor" opacity="0.8" />
      <path d="M10 16h4l-1 3-1 2-1-2Z" fill="#ff8a3d">
        <animate attributeName="opacity" values="1;0.45;1" dur="0.5s" repeatCount="indefinite" />
        <animateTransform
          attributeName="transform"
          type="scale"
          values="1 1;1 1.35;1 1"
          additive="sum"
          dur="0.5s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  )
}

/** Ethereum diamond. */
export function EthIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <path d="M12 2 6 12l6 3.5L18 12 12 2Z" fill="currentColor" opacity="0.95" />
      <path d="M6 13.2 12 22l6-8.8-6 3.5-6-3.5Z" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

/** $ coin token. */
export function CoinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.95" />
      <circle cx="12" cy="12" r="9" fill="none" stroke="#06061c" strokeWidth="1.4" opacity="0.5" />
      <path
        d="M12 6.5v11M9.5 9c0-1.2 1.1-2 2.5-2s2.5.8 2.5 2-1.1 1.8-2.5 1.8-2.5.8-2.5 2 1.1 2 2.5 2 2.5-.8 2.5-2"
        stroke="#06061c"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/** Liquidity droplet. */
export function DropletIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <path d="M12 3c3 4 5 6.4 5 9a5 5 0 0 1-10 0c0-2.6 2-5 5-9Z" fill="currentColor" />
      <path d="M9.5 13.5a2.5 2.5 0 0 0 2.5 2.5" stroke="#06061c" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  )
}

/** Padlock (LP locked). */
export function LockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <rect x="5" y="10" width="14" height="10" rx="2.5" fill="currentColor" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="12" cy="15" r="1.6" fill="#06061c" />
    </svg>
  )
}

/** Ban / renounced. */
export function BanIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M5.8 5.8 18.2 18.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** Zero-tax badge. */
export function ZeroTaxIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fontSize="11"
        fontWeight="800"
        fill="currentColor"
        fontFamily="Baloo 2, sans-serif"
      >
        0%
      </text>
    </svg>
  )
}

/** Verified contract / scroll-doc (OpenZeppelin ERC-20). */
export function ScrollDocIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2.5" fill="currentColor" opacity="0.95" />
      <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4" stroke="#06061c" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

/** Check (trust strip). */
export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.9" />
      <path d="M8 12.2 11 15l5-6" stroke="#06061c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

/** Wallet (connect). */
export function WalletIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <rect x="3" y="6" width="18" height="13" rx="3" fill="currentColor" opacity="0.95" />
      <path d="M3 9h12a2 2 0 0 1 0 4H3" fill="none" />
      <circle cx="17" cy="12.5" r="1.6" fill="#06061c" />
    </svg>
  )
}

/** Swap / flip arrows. */
export function SwapIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <path d="M8 4 4 8h8M8 4v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M16 20l4-4h-8M16 20v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

/** Twinkling spark/star. */
export function SparkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <path d="M12 2l1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2Z" fill="currentColor">
        <animateTransform attributeName="transform" type="scale" values="1;0.7;1" additive="sum" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.55;1" dur="2s" repeatCount="indefinite" />
      </path>
    </svg>
  )
}

/** Deflector shield (anti-bot). */
export function ShieldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <path d="M12 2.5 5 5.2v6c0 4.2 2.9 8.1 7 9.3 4.1-1.2 7-5.1 7-9.3v-6L12 2.5Z" fill="currentColor" opacity="0.95" />
      <path d="M8.5 12.2 11 14.6l4.5-5" stroke="#06061c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

/** Ringed planet. */
export function PlanetIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <circle cx="12" cy="11" r="5.5" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="10" ry="3.2" stroke="currentColor" strokeWidth="1.6" fill="none" opacity="0.7" transform="rotate(-20 12 12)" />
    </svg>
  )
}

/** Gem (diamond hands / hold). */
export function GemIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <path d="M6 4h12l3 5-9 11L3 9l3-5Z" fill="currentColor" opacity="0.95" />
      <path d="M3 9h18M9 4 6.5 9 12 20 17.5 9 15 4" stroke="#06061c" strokeWidth="1.2" fill="none" opacity="0.5" />
    </svg>
  )
}

/** Lightning bolt (lite mode). */
export function BoltIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor" />
    </svg>
  )
}

/** Close ✕. */
export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

// ── Social ───────────────────────────────────────────────────────────────
export function TelegramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <path d="M21 4 2.5 11.2c-1 .4-1 1.7.1 2l4.6 1.4 1.8 5.2c.3.8 1.2 1 1.8.4l2.5-2.4 4.4 3.2c.7.5 1.7.1 1.9-.8L22.9 5.3C23.1 4.3 22 3.6 21 4Z" fill="currentColor" />
      <path d="M7.2 14.6 16 8.2l-6.4 6.9-.2 3Z" fill="#06061c" opacity="0.35" />
    </svg>
  )
}

export function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <path d="M3 3h4.5l5 6.8L18 3h3l-7 9 7.5 9H17l-5.3-7.1L6 21H3l7.4-9.4L3 3Z" fill="currentColor" />
    </svg>
  )
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={base(className)} aria-hidden>
      <path d="M3 20h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="5" y="11" width="3" height="7" rx="1" fill="currentColor" />
      <rect x="10.5" y="7" width="3" height="11" rx="1" fill="currentColor" />
      <rect x="16" y="13" width="3" height="5" rx="1" fill="currentColor" />
      <path d="M5 9l5-3 4 2 5-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
    </svg>
  )
}
