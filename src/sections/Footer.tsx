import type { ReactElement } from 'react'
import { FOOTER } from '../copy'
import { SOCIAL_LINKS } from '../links'
import {
  RocketIcon,
  TelegramIcon,
  XIcon,
  ChartIcon,
} from '../components/icons'

const ICONS: Record<string, (p: { className?: string }) => ReactElement> = {
  telegram: TelegramIcon,
  x: XIcon,
  dexscreener: ChartIcon,
}

export function Footer() {
  return (
    <footer className="pointer-events-auto flex flex-col items-center gap-5 px-4 pb-16 pt-8 text-center">
      <div className="flex items-center gap-2 font-display text-2xl font-extrabold text-white heading-glow">
        <RocketIcon className="h-7 w-7 text-rocket-cyan" /> $ROCKET
      </div>
      <p className="text-sm italic text-rocket-cyan">{FOOTER.tagline}</p>

      <div className="flex gap-3">
        {SOCIAL_LINKS.map((link) => {
          const Ico = ICONS[link.id] ?? ChartIcon
          const isPlaceholder = link.href === '#' || link.href === 'NA'
          return (
            <a
              key={link.id}
              href={isPlaceholder ? undefined : link.href}
              target={isPlaceholder ? undefined : '_blank'}
              rel="noopener noreferrer"
              onClick={isPlaceholder ? (e) => e.preventDefault() : undefined}
              title={isPlaceholder ? `${link.label} — coming soon` : link.label}
              aria-disabled={isPlaceholder}
              className={`flex h-12 w-12 items-center justify-center rounded-full bg-space-700/70 text-white/85 ring-1 ring-rocket-violet/40 backdrop-blur transition-all hover:scale-110 hover:bg-rocket-violet/30 hover:text-white ${
                isPlaceholder ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
              }`}
            >
              <Ico className="h-5 w-5" />
            </a>
          )
        })}
      </div>

      <p className="max-w-2xl text-xs leading-relaxed text-white/45">
        {FOOTER.disclaimer}
      </p>
      <p className="text-xs text-white/35">{FOOTER.copyright}</p>
    </footer>
  )
}
