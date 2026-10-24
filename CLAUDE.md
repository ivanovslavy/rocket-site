# CLAUDE.md — Rocket Site

Working guide for Claude Code (and any developer) on this repository.

## Rules (always)

1. **Do exactly what the user asks — and nothing they did not ask for.** Do not change existing
   behaviour, UX, or features that were not part of the request, not even as a "side effect" of
   another fix. If a requested fix seems to require touching unrelated behaviour, scope the fix
   as narrowly as possible (or ask first). Do it all with the best security practices available
   (no secrets in client code, no `dangerouslySetInnerHTML` with untrusted input, validate
   anything that reaches `viem`/`wagmi`, keep RPC keys/addresses in `.env`, never commit `.env`).
2. **Check dependencies on every edit.** Before adding or changing a dependency, confirm it
   is necessary, maintained, and not introducing a vulnerability (`npm ls <pkg>`,
   `npm audit`). Prefer existing libraries already in `package.json` over new ones. After
   touching imports, make sure the package is actually installed and the build still resolves.
3. **Write everything in English** (UI copy, comments, commit messages, docs).
4. **Keep the tone lightly humorous**, matching the current site voice — playful, space/rocket
   themed, a little tongue-in-cheek, but never misleading about what the token actually does.
5. **After every change, verify it.** Run `npm run build` (this also type-checks via `tsc -b`),
   then run the app and confirm the change actually loads and behaves as expected. If something
   is broken, find the cause and fix it before considering the task done. See "Verifying
   changes" below.

## Project

A single-page marketing site for the **$ROCKET** meme token on Ethereum.

- **Stack:** React 19 + TypeScript + Vite, Tailwind v4, Three.js via `@react-three/fiber`
  + `drei` + `postprocessing`, wallet via `wagmi` + RainbowKit.
- **Build:** `npm run build` (`tsc -b && vite build`). **Dev:** `npm run dev`. **Preview:**
  `npm run preview`. **Lint:** `npm run lint`.

### How it is structured

- `src/copy.ts` — **all on-page text lives here** (English only). Edit copy here, never inline
  in components.
- `src/sections/` — HTML content. `Hero`, `SwapTerminal`, `Footer` are always visible. The
  Mission / Tokenomics / Anti-Bot / How-to-Buy blocks are **hidden** and open from
  `FeaturePanel` when their 3D planet is clicked. Lore chapters open from `LorePanel`.
- `src/three/` — the 3D scene. `Scene.tsx` builds it; `flightPath.ts` lays out every planet by
  a scroll fraction (`FEATURE_ANCHORS`, `LORE_ANCHORS`, `DECOR_ANCHORS`, `TOKENOMICS_ANCHOR`).
  Clickable "feature" planets carry a smiley face + halo and open a panel.
- `src/store.ts` — tiny module-level UI store bridging the R3F canvas and the HTML layer
  (R3F has its own reconciler, so React context does not cross cleanly). In DEV it exposes
  `window.__ui` for automated checks.
- `src/scroll.ts` — shared scroll progress (`scrollState.offset`, 0 at top, 1 at bottom).

### Adding a clickable feature planet (pattern)

1. Add the copy to `src/copy.ts`.
2. Add a content component in `src/sections/` (e.g. `AntiBot.tsx`).
3. Register it in `src/sections/FeaturePanel.tsx` (`TITLES` + the `content()` switch) and add
   the id to the `feature` union in `flightPath.ts`.
4. Add a `FeatureAnchor` to `FEATURE_ANCHORS` at the right scroll fraction. `Scene.tsx` renders
   all anchors automatically.

### Notes / gotchas

- Feature and lore planets must rotate the **group** (sphere + smiley face together), not just
  the inner sphere — a solid sphere alone shows no visible motion, so rotating only the mesh
  makes the planet look frozen.
- `window.__ui` is **DEV-only**. For headless verification, run `npm run dev` (not `preview`)
  so you can drive `window.__ui.clickFeature(...)`.

## Verifying changes

1. `npm run build` — must succeed (type-check + bundle). Warnings from `node_modules` are not
   our errors.
2. `npm run dev -- --port 5211` and load it headless (Chrome at `/usr/bin/google-chrome`, see
   `shot.mjs` for the puppeteer-core pattern). Use `waitUntil: 'domcontentloaded'` — the 3D
   scene never goes network-idle.
3. Capture `console`/`pageerror` events (must be empty), screenshot the affected area, and
   assert the expected text/behaviour (e.g. open a panel via `window.__ui.clickFeature('id')`
   and read its text). Fix anything that does not load or behave as expected.

## Recent changes (2026-06-04)

- Hero: set the tagline to the "runs on its own fuel" line; added a humorous **deflector
  shield** callout; removed the two CTA links from the hero block.
- Corrected the copy: the token is **not** a plain OpenZeppelin ERC-20 anymore — it is a
  **standard ERC-20 with a temporary anti-bot mechanism**. Updated Mission, Tokenomics facts,
  moon facts and the trust strip accordingly.
- Tokenomics supply changed from 1B to **100,000,000,000 (100B)**.
- Added a new clickable **Anti-Bot Shield** planet (teal) between Tokenomics and How-to-Buy,
  opening a panel that explains the Ethereum launch windows (blocks 1–5 / 6–10 / 11–15 → max
  wallet 1/2/3% and 50/40/30% sell tax burned, then a clean 0%-tax ERC-20).
- Fixed feature planets so they **always rotate** (rotate the group so the smiley spins with
  the planet, matching the lore planets).

### 2026-06-04 (follow-up)

- **Spread out the last feature planets.** The Tokenomics / Anti-Bot / How-to-Buy planets were
  cramped; `ANCHORS`/`FEATURE_ANCHORS` now place all four feature planets ~0.10 apart, like the
  lore planets.
- **Every clickable smiley planet now rotates its own way.** `Planet`/`FeaturePlanet` take a
  signed `spin` (speed + direction) and an `initialAngle`; `LORE_SPIN`/`FEATURE_SPIN` in
  `Scene.tsx` give each planet distinct values so the smileys never line up. The big tokenomics
  planet and its moons (satellites) are intentionally left as-is.
- **Fixed the swap terminal feeling "dead".** R3F listens on the shared root `eventSource`, so it
  raycast planets *through* the swap card — hovering/clicking the inputs popped a planet panel
  over them and stole focus. Fix: `isOverHtmlUi()` makes planets/moons ignore events that land on
  an HTML card (`src/three/pointer.ts`), and the swap card stops pointer (not click) events from
  reaching the root so input focus is never hijacked. Buttons still work (they use `click`).
- **Swap footer venue.** Now reads "Live on Ethereum · Uniswap v2 · slippage 0.3%" via
  `LAUNCH_VENUE` (config). `DEFAULT_SLIPPAGE` is 0.3% (Uniswap v2 standard) and the slippage
  buttons are 0.3 / 0.5 / 1.

### 2026-06-04 (deploy prep)

- **Swap → Uniswap v2 on the last deployed token.** `.env` `VITE_SWAP_VERSION=v2`,
  `VITE_TOKEN_ADDRESS_SEPOLIA=0x1A15Be833cFFb8FFB6fDE21c875d5Ee2fa58e388`; `config.ts` sepolia
  `v2Router` fixed to the official `0xeE56…CfE3` (factory `0xF62c…80E6`, where the RCT/WETH pair
  lives); `links.ts` `CONTRACT_ADDRESS_DISPLAY` set to the CA. Note: a Vite cache can keep an old
  inlined env value — clean with `rm -rf dist node_modules/.vite` before rebuilding.
- **Branding assets.** New `public/logo.svg` (rocket emblem) + generated PNGs:
  `favicon-32/192.png`, `apple-touch-icon.png`, `logo-256/512.png` (Dexscreener/Dextools square
  logo), and `og.svg` → `og-image.png` (1200×630 social/Dexscreener header). `index.html` wired
  up with favicon links + Open Graph/Twitter tags (emoji removed from the title). Regenerate PNGs
  with `rsvg-convert` (see commit) if the SVGs change.
- **`migration.md`** — full Hetzner deploy plan: rsync, a systemd unit for the RPC proxy, an
  Apache2 vhost (serves `dist/` directly + reverse-proxies `/rpc/`), and Cloudflare DNS + Origin
  Cert SSL. Security: all RPC API keys stay in `server/.env` (backend proxy); the only
  browser-exposed value is the public WalletConnect project id.

### 2026-06-04 (event-handling fix)

- **Reverted the earlier `data-solid`/`isOverHtmlUi` guard** — it changed planet behaviour
  (hover/click stopped opening panels) and was NOT a requested change. Per Rule 1, only the
  narrow fix remains.
- **Root cause of the "swap dead / can't select text" issue:** R3F listens on the shared root
  (`eventSource`), so dragging to select text would fire planet hovers and pop preview panels
  mid-drag, interrupting the selection/focus. (Switching `eventSource` to the canvas breaks
  planet clickability — the canvas sits behind the root and never receives the gap clicks — so
  that is NOT an option.)
- **Fix:** planet/moon `onPointerOver` now skips when a mouse button is held
  (`(e.nativeEvent?.buttons ?? 0) !== 0`). Normal hover (no button) is unchanged, so planets work
  exactly as before; a text-selection drag no longer triggers them. `onClick` is untouched.
- Note: headless puppeteer testing is unreliable in this sandbox (long runs get SIGTERM-killed),
  so verify planet hover/click + text selection + swap typing in a real browser.
