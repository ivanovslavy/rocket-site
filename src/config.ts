import { mainnet, sepolia } from 'wagmi/chains'
import type { Chain } from 'viem'

/**
 * Chain + swap configuration, driven by `.env`.
 *
 * Testing now runs on Sepolia with a deployed test token. At launch, flip
 * VITE_CHAIN=mainnet and set VITE_TOKEN_ADDRESS_MAINNET — no code change.
 *
 * The swap goes live automatically the moment the active chain has a token
 * address; if it's empty the terminal renders in mock "Launching soon" mode.
 */
const ACTIVE = (import.meta.env.VITE_CHAIN ?? 'sepolia') as 'sepolia' | 'mainnet'

export const IS_MAINNET = ACTIVE === 'mainnet'
export const CHAIN: Chain = IS_MAINNET ? mainnet : sepolia
export const CHAIN_ID = CHAIN.id

export const TOKEN_SYMBOL = 'ROCKET' as const
export const TOKEN_DECIMALS = 18

/**
 * Which Uniswap version this token's liquidity lives on. Older tokens may only
 * have a v2 pair; new tokens may be v4-native. Set per token via
 * `VITE_SWAP_VERSION=v2|v3|v4`. Defaults to v3 (the original integration).
 */
export type SwapVersion = 'v2' | 'v3' | 'v4'
export const SWAP_VERSION = ((import.meta.env.VITE_SWAP_VERSION as string) ||
  'v3') as SwapVersion

/** Uniswap v3 pool fee tier in hundredths of a bip (3000 = 0.30%). */
export const POOL_FEE = 3000

/**
 * v4 pools are keyed by a PoolKey (fee, tickSpacing, hooks) that cannot be
 * inferred from the token alone — they MUST be configured per token via env.
 * Sensible no-hook defaults are provided so a plain 0.30% pool works out of the
 * box; override for custom fee/tickSpacing/hook pools.
 */
export const V4_FEE = Number(import.meta.env.VITE_V4_FEE ?? 3000)
export const V4_TICK_SPACING = Number(import.meta.env.VITE_V4_TICK_SPACING ?? 60)
export const V4_HOOKS = ((import.meta.env.VITE_V4_HOOKS as string) ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`

/**
 * Per-chain address book. v3 verified from Uniswap docs; v2 Router02, v4
 * UniversalRouter / V4Quoter / PoolManager / Permit2 verified against Etherscan
 * + the official v4 deployments page.
 */
const ADDRESSES = {
  mainnet: {
    token: (import.meta.env.VITE_TOKEN_ADDRESS_MAINNET || '') as string,
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    // v3
    quoterV2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
    swapRouter02: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    // v2
    v2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    // v4 (Etherscan-verified UR; v4 deployments page for the rest)
    universalRouter: '0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af',
    v4Quoter: '0x52F0e24D1c21C8A0cB1e5a5dD6198556BD9E1203',
    poolManager: '0x000000000004444c5dc75cB358380D2e3dE08A90',
    permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  },
  sepolia: {
    token: (import.meta.env.VITE_TOKEN_ADDRESS_SEPOLIA || '') as string,
    weth: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14',
    // v3
    quoterV2: '0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3',
    swapRouter02: '0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E',
    // v2 — official Uniswap V2 Router02 on Sepolia (factory
    // 0xF62c03E08ada871A0bEb309762E260a7a6a880E6); the RocketToken/WETH pair lives here.
    v2Router: '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3',
    // v4
    universalRouter: '0x3A9D48AB9751398BbFa63ad67599Bb04e4BdF98b',
    v4Quoter: '0x61B3f2011A92d183C7dbaDBdA940a7555Ccf9227',
    poolManager: '0xE03A1074c86CFeDd5C142C4F04F1a1536e203543',
    permit2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  },
} as const

const A = ADDRESSES[ACTIVE]

const asAddr = (v: string): `0x${string}` | null =>
  /^0x[a-fA-F0-9]{40}$/.test(v) ? (v as `0x${string}`) : null

/** The token contract for the active chain, or null → mock mode. */
export const TOKEN_ADDRESS: `0x${string}` | null = asAddr(A.token)
export const WETH_ADDRESS = A.weth as `0x${string}`
export const QUOTER_V2_ADDRESS = A.quoterV2 as `0x${string}`
export const SWAP_ROUTER_02_ADDRESS = A.swapRouter02 as `0x${string}`
export const V2_ROUTER_ADDRESS = A.v2Router as `0x${string}`
export const UNIVERSAL_ROUTER_ADDRESS = A.universalRouter as `0x${string}`
export const V4_QUOTER_ADDRESS = A.v4Quoter as `0x${string}`
export const POOL_MANAGER_ADDRESS = A.poolManager as `0x${string}`
export const PERMIT2_ADDRESS = A.permit2 as `0x${string}`

/** Native-ETH sentinel used by Uniswap v4 (currency0 = address(0)). */
export const NATIVE_CURRENCY =
  '0x0000000000000000000000000000000000000000' as `0x${string}`

/** Mock-mode display rate (only used when TOKEN_ADDRESS === null). */
export const MOCK_RATE_ROCKET_PER_ETH = 5_000_000

/** Swap form defaults. */
export const DEFAULT_SLIPPAGE = 0.3 // % — Uniswap v2 standard 0.30% pool fee
export const DEFAULT_DEADLINE_MINUTES = 20

/**
 * Public-facing launch venue shown in the swap terminal footer. The token
 * launches as a Uniswap v2 pair on Ethereum (see the token contract's "Why
 * Uniswap V2" notes). Test routing is still driven by VITE_CHAIN/VITE_SWAP_VERSION.
 */
export const LAUNCH_VENUE = { chain: 'Ethereum', dex: 'Uniswap v2' } as const

/** WalletConnect Cloud project id (empty → injected wallets only). */
export const TURNSTILE_SITEKEY = (import.meta.env.VITE_TURNSTILE_SITEKEY || '') as string

export const WALLETCONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? ''
