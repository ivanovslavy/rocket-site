/**
 * Every word of on-page copy lives here (English only). The values are used
 * verbatim from the build brief — edit here, never inline in components.
 */

export const HERO = {
  ticker: '$ROCKET',
  chain: 'Ethereum',
  tagline:
    '$ROCKET — the only token that runs on its own fuel: your belief and a little bit of memes. Buckle up.',
  shield:
    'Pre-flight perk: the moment our stellar journey lifts off, $ROCKET raises a deflector shield for a short while — snipers and sneaky bots bounce right off the hull. ;)',
}

export interface LoreChapterCopy {
  id: string
  chapter: string
  planet: string
  subtitle: string
  body: string
}

export const LORE_CHAPTERS: LoreChapterCopy[] = [
  {
    id: 'origin',
    chapter: 'Lore Chapter 1',
    planet: 'Planet Origin',
    subtitle: 'where it all started',
    body: "Before the charts, before the holders, there was just one garage-built rocket — bolted together from memes, caffeine, and one very bad idea at 3 AM. Nobody thought it would fly. That's exactly why it did. $ROCKET wasn't stitched up by suits in glass towers — it was born from people who'd watched enough “next big tokens” burn up on re-entry, and decided to build something that just… doesn't stop climbing.",
  },
  {
    id: 'crew',
    chapter: 'Lore Chapter 2',
    planet: 'Planet Crew',
    subtitle: 'we are the fuel',
    body: 'Every rocket needs fuel. Ours isn’t kerosene — it’s community. The more hands grab the rails, the harder the thrusters burn. Along the way we pass planets with heavy gravity (we call them “paper hands” — they drag down anyone who hesitates), but the $ROCKET crew wears diamond seatbelts. We toss tokens overboard not because we’re losing them — every planet that catches one joins our orbit. This isn’t an escape from Earth. It’s an expedition.',
  },
  {
    id: 'horizon',
    chapter: 'Lore Chapter 3',
    planet: 'Planet Horizon',
    subtitle: "where we're headed",
    body: 'People ask “how long to the moon?” — we passed it back in chapter two. $ROCKET isn’t flying to one destination, but to the next one, and the one after that. The map has no edge, only new coordinates. So — hold the coin tight, don’t stare too long at the rear-view, space is big, there’s plenty of fuel, and the contract is open for anyone to read — no fine print, no hidden thrusters. That’s the whole trick: there is no trick. Just a rocket, a crew, and an endless sky. The best part of the story isn’t written yet. We’ll write it together.',
  },
]

export const MISSION = {
  title: 'The Mission',
  tagline: 'Infinite space, zero nonsense.',
  paragraphs: [
    '$ROCKET is built on one simple rule: what you see is what you fly. It’s a standard ERC-20 (OpenZeppelin-based and fully verified) with one extra part bolted on the hull — a short-lived anti-bot shield that’s only armed for the first few blocks after launch. While the shield is up, snipers can’t swallow the whole galaxy in one bite. The instant it powers down, $ROCKET is a plain, honest token: no hidden taxes, no traps, no clever math draining your wallet while you sleep.',
    'This isn’t a financial advisor with a diamond earring. It’s a meme token — made for fun, for openness, and for that specific thrill of watching a green candle at 2 AM with a crew beside you. There’s no “future development,” no roadmap, no promises of utility coming “soon™.” The whole supply went into the pool, the liquidity is locked, ownership is renounced — and from there it’s just us, trading and memeing in the open. Nobody’s promising you the Moon (it’s small anyway). We only promise a fair game and an endless cosmos to explore.',
    'The contract is open. The shield is temporary. The thrusters are not. Climb in.',
  ],
}

/** Tokenomics facts — these are the values carried by the orbiting moons. */
export type IconKey =
  | 'coin'
  | 'droplet'
  | 'lock'
  | 'ban'
  | 'zerotax'
  | 'doc'
  | 'eth'
  | 'wallet'
  | 'swap'
  | 'gem'

export interface MoonFact {
  id: string
  icon: IconKey
  label: string
  value: string
}

export const MOON_FACTS: MoonFact[] = [
  { id: 'supply', icon: 'coin', label: 'Supply', value: '100,000,000,000' },
  { id: 'liquidity', icon: 'droplet', label: 'Liquidity', value: '3 ETH, 100% in pool' },
  { id: 'lp', icon: 'lock', label: 'LP Locked', value: 'Liquidity locked' },
  { id: 'renounced', icon: 'ban', label: 'Ownership', value: 'Renounced' },
  { id: 'tax', icon: 'zerotax', label: '0% Tax', value: 'After launch shield' },
  { id: 'oz', icon: 'doc', label: 'Contract', value: 'ERC-20 + anti-bot' },
]

export const TOKENOMICS = {
  title: 'Tokenomics',
  subtitle: 'A pure fair launch. The simplicity is the selling point.',
  intro:
    'No team allocation. No presale. Nothing held back. The entire supply went straight into the pool — and stayed there.',
  donut: [
    { label: 'Liquidity', value: 100, color: '#34e0ff' },
    { label: 'Team', value: 0, color: '#ff5cc8' },
    { label: 'Presale', value: 0, color: '#ffd23f' },
  ],
  facts: [
    { k: 'Total supply', v: '100,000,000,000 $ROCKET (fixed, no mint)' },
    { k: 'Liquidity', v: '3 ETH · 100% of supply in the pool' },
    { k: 'LP', v: 'Locked' },
    { k: 'Ownership', v: 'Renounced' },
    { k: 'Tax', v: '0% buy / 0% sell (after the launch shield)' },
    { k: 'Anti-bot', v: 'Temporary shield at launch only' },
    { k: 'Contract', v: 'Standard ERC-20 + anti-bot, verified' },
    { k: 'Roadmap', v: 'None — by design' },
  ],
  noRoadmap:
    'No future development. No roadmap. By design. The "plan" is: fair launch, locked liquidity, let the community trade and meme.',
}

export const TRUST_STRIP = [
  'Standard ERC-20',
  'Anti-bot shield at launch',
  '0% Tax after launch',
  'LP Locked',
]

export interface BuyStep {
  n: number
  title: string
  body: string
  icon: IconKey
}

export const HOW_TO_BUY: BuyStep[] = [
  { n: 1, icon: 'eth', title: 'Get ETH', body: 'Buy ETH on any exchange and send it to your self-custody wallet.' },
  { n: 2, icon: 'wallet', title: 'Connect Wallet', body: 'Hit Connect Wallet and pick your wallet. No sign-up, no email.' },
  { n: 3, icon: 'swap', title: 'Swap', body: 'Enter an amount, confirm, and swap ETH for $ROCKET in the terminal below.' },
  { n: 4, icon: 'gem', title: 'Hold', body: 'Buckle up, grab the rails, and enjoy the ride through the cosmos.' },
]

export const SWAP_COPY = {
  title: 'Swap Terminal',
  subtitle: 'ETH ⇄ ROCKET',
  launchingSoon: 'Launching soon',
  connect: 'Connect Wallet',
  buy: 'Buy $ROCKET',
  sell: 'Sell $ROCKET',
  mockNote:
    'Preview mode — live trading opens at launch. Connect Wallet already works.',
}

/** Anti-bot section — opens from its own planet, between Tokenomics and How-to-Buy. */
export interface AntiBotTier {
  window: string
  wallet: string
  tax: string
}

export const ANTIBOT = {
  title: 'Anti-Bot Shield',
  subtitle: 'A short force-field at launch — then a plain, honest token.',
  intro:
    'Snipers love a fresh launch. So for the first few blocks $ROCKET flies with the shields up: bots trying to swallow the whole galaxy in one bite get bounced. The shield weakens block by block and then powers down for good — from there on it’s a clean, standard ERC-20.',
  chainNote:
    'Tuned for Ethereum (~12s blocks). The windows below are counted in blocks from the moment trading opens.',
  tiers: [
    { window: 'Blocks 1–5 (~1 min)', wallet: 'Max 1% per wallet', tax: '50% sell tax → burned' },
    { window: 'Blocks 6–10 (~2 min)', wallet: 'Max 2% per wallet', tax: '40% sell tax → burned' },
    { window: 'Blocks 11–15 (~3 min)', wallet: 'Max 3% per wallet', tax: '30% sell tax → burned' },
    { window: 'After block 15', wallet: 'No limit', tax: '0% — shield down' },
  ] as AntiBotTier[],
  notes: [
    'The sell tax is never collected by anyone — it is burned. It deflates supply and punishes snipers instead of funding a dev wallet.',
    'No exempt addresses: the team flies by the exact same rules as everyone else.',
    'Once the shield is down it stays down — $ROCKET becomes a normal 0%-tax ERC-20 forever, with no switch to turn it back on.',
  ],
}

export const FOOTER = {
  tagline: 'Infinite space, zero nonsense.',
  disclaimer:
    '$ROCKET is a meme token for entertainment. No promises, no utility, no roadmap — just a fair launch and an open contract. Not financial advice. DYOR.',
  copyright: '$ROCKET — built by the crew, fueled by memes.',
}
