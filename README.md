# $ROCKET — animated 3D single-page site

A single-page React site for the **$ROCKET** meme token. The whole page is a
finite, top-to-bottom animated 3D space scene: a toon rocket flies an authored
spline through a realistic telescope-like cosmos, passing clickable planets
(lore chapters) and a big tokenomics planet with clickable fact-moons, while
jettisoning coins that get gravitationally absorbed by planets. A Uniswap-style
swap terminal sits near the bottom. English only.

## Stack
Vite · React 19 · TypeScript · Tailwind v4 · three.js + @react-three/fiber +
@react-three/drei · @react-three/postprocessing (Bloom) · wagmi + viem +
RainbowKit. Plus a tiny zero-dependency Node RPC proxy in `server/`.

## Run
```bash
# 1) key-holding RPC proxy (holds all RPC API keys server-side)
cd server && cp .env.example .env   # fill in keys
npm start                           # http://localhost:8787

# 2) frontend (in another terminal)
npm install
cp .env.example .env                # VITE_CHAIN, token CA, WalletConnect id, backend url
npm run dev                         # http://localhost:5173
npm run build                       # production build → dist/
```
The frontend works without the proxy too (public RPCs are tried first); the
proxy is only the keyed fallback.

## Architecture
- The **3D canvas is fixed behind everything** (`-z-10`). The HTML content is a
  normal scrollable DOM overlay on top (`z-10`) so it keeps full React context
  (wagmi/RainbowKit) and stays crisply readable. The content wrapper is
  `pointer-events-none` so the page reads as one surface.
- **Clicking the 3D planets through the HTML:** the `<Canvas>` uses
  `eventSource={root}` + `eventPrefix="client"`, so R3F raycasts from client
  coordinates regardless of DOM stacking — glowing planets/moons stay clickable
  even though the canvas is visually behind the content.
- One shared scroll drives both layers (`src/scroll.ts`): the camera flies down
  a finite column of planets; the rocket follows an authored spline and always
  points **nose-first in the scroll direction** (flips when you scroll up).
- **All glowing planets share one interaction model** (`src/store.ts`): hover a
  planet → its panel previews; leave → it hides unless pinned; click → pins it
  open (✕ / clicking the planet again / Escape closes). This applies equally to
  the lore planets (`<LorePanel/>`) and the Mission / Tokenomics / Anti-Bot /
  How-to-Buy feature planets (`<FeaturePanel/>`). Only one panel shows at a time. Both
  panels are non-modal (no blocking backdrop) so planets stay hoverable
  underneath. Decorative planets have no halo and do nothing.
- **Tokenomics moons** (`src/three/Moon.tsx`) are spread across staggered orbits;
  hovering any one moon **freezes the whole constellation** so the moon and its
  fact tooltip stay put, and hover/click pin a fact like the planets do.
- **Swap flip animation** (`src/sections/SwapTerminal.tsx`): the flip button
  slowly swaps the two token boxes — "You pay" glides down to the "You receive"
  slot and back up (~600ms); once they've traded places the tokens themselves
  flip and the boxes snap back to their slots.
- Every clickable object carries a pulsing glowing **halo** (`ClickableHalo`).
- All icons are themed SVGs (`src/components/icons.tsx`) — no emoji.
- 3D in `src/three/`, HTML in `src/sections/`.

## Secrets / config
- **RPC API keys live ONLY in `server/.env`** (gitignored) and never reach the
  browser. The proxy (`server/index.mjs`) forwards JSON-RPC per chain and
  rotates across keyed providers (Infura, Alchemy, each Ankr key, QuickNode) on
  any 429/5xx/timeout.
- **Frontend `.env`** holds only client-safe values: `VITE_CHAIN`, token
  addresses, `VITE_WALLETCONNECT_PROJECT_ID` (public by design), and
  `VITE_BACKEND_URL`.
- **RPC fallback (`src/rpc.ts`):** public keyless providers FIRST, then the
  key-holding backend proxy as the fallback — "if one doesn't work, use the
  next", with the keys safely server-side.
- Address book + chain selection in `src/config.ts`; links in `src/links.ts`;
  all copy in `src/copy.ts`.

## Swap: live on Sepolia now
The swap is **live** once the active chain has a token address. Currently
`VITE_CHAIN=sepolia` with the test contract.

### Multi-version routing (v2 / v3 / v4)
The terminal is no longer limited to v3 — it routes through whichever Uniswap
version the token's liquidity lives on, selected per token with
`VITE_SWAP_VERSION=v2|v3|v4` (default `v3`). The version-specific quoting and
tx-building lives in **`src/swap/routes.ts`**; `useSwap` stays version-agnostic.

- **v2** — constant-product Router02. Quote via `getAmountsOut`; ETH legs use
  `swapExactETHForTokens` / `swapExactTokensForETH` (router wraps WETH). Sell
  needs one ERC-20 `approve` to the v2 router.
- **v3** — QuoterV2 + SwapRouter02. Buy `exactInputSingle`; sell
  `approve` → `multicall(exactInputSingle + unwrapWETH9)`.
- **v4** — quotes via the standalone **V4Quoter**; swaps execute through the
  **Universal Router** as one `V4_SWAP` command
  (`SWAP_EXACT_IN_SINGLE → SETTLE_ALL → TAKE_ALL`). Native ETH is `address(0)`.
  Pools are keyed by a **PoolKey** (`fee`, `tickSpacing`, `hooks`) that can't be
  auto-detected, so it's configured via `VITE_V4_FEE` / `VITE_V4_TICK_SPACING` /
  `VITE_V4_HOOKS` (defaults = a plain 0.30% no-hook pool). Selling the token
  uses the Permit2 two-step: ERC-20 `approve(token → Permit2)` then
  `Permit2.approve(token, UniversalRouter, …)`.

All addresses (v2 Router, v3 Quoter/Router, v4 UniversalRouter / V4Quoter /
PoolManager / Permit2) for mainnet + Sepolia are in `src/config.ts`, verified
against Etherscan and the official Uniswap v4 deployments page.

> ⚠️ v2/v4 are implemented but **not yet verified end-to-end against a live
> pool** (no test pool was available). The v3 path is the only one verified:
> 0.01 ETH ≈ 3.31M ROCKET on the Sepolia pool. Test v2/v4 against a real pool
> before relying on them.

### Going to mainnet (config only)
Set `VITE_CHAIN=mainnet`, `VITE_TOKEN_ADDRESS_MAINNET=<CA>` and the right
`VITE_SWAP_VERSION` in `.env`; all Uniswap addresses are already in
`src/config.ts`. If the active chain's token address is empty, the terminal
falls back to mock "Launching soon" mode.
