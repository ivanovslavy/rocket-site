import { CHAIN } from './config'

/**
 * Social & explorer links. All placeholders for now — swap the `href`
 * values for the real URLs at launch. `href: '#'` renders as a live-looking
 * button that simply does nothing yet.
 */
export interface SocialLink {
  id: string
  label: string
  href: string
  /** shown when no real URL is set yet */
  placeholder: boolean
}

export const SOCIAL_LINKS: SocialLink[] = [
  { id: 'telegram', label: 'Telegram', href: '#', placeholder: true },
  { id: 'x', label: 'X (Twitter)', href: '#', placeholder: true },
  { id: 'dexscreener', label: 'Dexscreener', href: '#', placeholder: true },
]

/** On-chain placeholders shown across the page (copy buttons, explorer). */
export const CONTRACT_ADDRESS_DISPLAY = '0x9960Dc6f2b0a20C72DCf10eB147979B6eC67a016'
export const LP_LOCKER_URL = 'NA'
export const RENOUNCE_TX_URL = 'NA'
export const VERIFIED_CONTRACT_URL = 'NA'

/** Block-explorer URL for a confirmed swap tx on the active chain. */
export function txUrl(hash: string): string {
  const base = CHAIN.blockExplorers?.default.url ?? 'https://etherscan.io'
  return `${base}/tx/${hash}`
}
