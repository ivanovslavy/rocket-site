# $ROCKET

The official website for **$ROCKET** — a meme token with an animated, interactive
3D space scene and a built-in Uniswap swap terminal.

🌐 **Live:** https://rocket.reisen
🪙 **Token contract:** [`ERC20-Rocket`](https://github.com/ivanovslavy/ERC20-Rocket) — verified ERC-20 (fee-on-transfer), source public.

> ⚠️ Currently running on the **Sepolia testnet** for public testing. Nothing here
> is financial advice. Always verify the contract address before trading.

---

## What it is

A single-page React site. The whole page is one finite, top-to-bottom animated 3D
space scene: a toon rocket flies an authored path through a telescope-like cosmos,
passing clickable planets (lore chapters, tokenomics facts) while a Uniswap-style
**swap terminal** sits near the bottom. The 3D canvas is fixed behind the content;
the readable HTML scrolls on top, and the glowing planets stay clickable through it.

## Tech stack

Vite · React 19 · TypeScript · Tailwind v4 · three.js + @react-three/fiber / drei /
postprocessing · wagmi + viem + RainbowKit. Plus a tiny zero-dependency Node RPC
proxy in [`server/`](server/) that keeps RPC API keys server-side.

## Running locally

```bash
# frontend
npm install
cp .env.example .env     # VITE_CHAIN, token address, WalletConnect id, backend url
npm run dev              # http://localhost:5173
npm run build            # production build -> dist/

# (optional) the key-holding RPC proxy, in another terminal
cd server && cp .env.example .env   # fill in RPC keys
npm start                           # http://localhost:8787
```

The frontend works **without** the proxy — public keyless RPCs are tried first and
the keyed proxy is only the fallback (see `src/rpc.ts`).

## The swap terminal

The terminal routes through whichever Uniswap version the token's liquidity lives
on, selected with `VITE_SWAP_VERSION=v2|v3|v4`. Version-specific quoting and
transaction building live in [`src/swap/routes.ts`](src/swap/routes.ts); the
`useSwap` hook stays version-agnostic.

- **v2** (active) — constant-product Router02. Because $ROCKET is a fee-on-transfer
  token, swaps use the `...SupportingFeeOnTransferTokens` functions. Selling needs
  one ERC-20 `approve` to the v2 router for the **exact amount being sold** (never
  an unlimited approval).
- **v3** — QuoterV2 + SwapRouter02.
- **v4** — V4Quoter + the Universal Router (Permit2 two-step for sells).

All Uniswap addresses for mainnet and Sepolia are in
[`src/config.ts`](src/config.ts), verified against Etherscan and the official
Uniswap deployments.

### Switching to mainnet

Config only — set `VITE_CHAIN=mainnet`, `VITE_TOKEN_ADDRESS_MAINNET=<CA>` and the
matching `VITE_SWAP_VERSION` in `.env`, then rebuild. If the active chain has no
token address, the terminal shows a "Launching soon" placeholder.

## Security & configuration

- **No private keys are ever handled by the site.** Swaps are standard Uniswap
  calls signed in the user's own wallet; approvals are exact-amount; no backend
  custody and no user data is collected.
- **RPC API keys live only in `server/.env`** (gitignored) and never reach the
  browser. The proxy rotates across keyed providers on any 429/5xx/timeout.
- The frontend `.env` holds only client-safe values (`VITE_CHAIN`, token
  addresses, the public WalletConnect id, backend url).

## Project layout

- `src/three/` — the 3D scene (scene, rocket, planets, moons, starfield).
- `src/sections/` — the HTML overlay (hero, panels, swap terminal, footer).
- `src/swap/` + `src/hooks/useSwap.ts` — quoting and swap execution.
- `src/config.ts` / `src/links.ts` / `src/copy.ts` — addresses, links, all copy.
- `server/` — the zero-dependency RPC proxy.

## License

MIT
