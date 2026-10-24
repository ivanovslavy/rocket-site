import { fallback, http, type Transport } from 'viem'
import { mainnet, sepolia } from 'wagmi/chains'

/**
 * RPC fallback strategy:
 *   1. PUBLIC, keyless providers FIRST (direct from the browser).
 *   2. Then the key-holding backend proxy (src/../server) as a fallback. The
 *      proxy internally rotates across every keyed provider (Infura, Alchemy,
 *      each Ankr key, QuickNode), so the API keys stay server-side and a
 *      rate-limited key just rotates out.
 *
 * viem's `fallback` transport moves to the next endpoint on any error
 * (HTTP 429/5xx, timeout, …) — "if one doesn't work, use the next".
 */
const BACKEND = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787').replace(
  /\/$/,
  '',
)

const PUBLIC_URLS: Record<number, string[]> = {
  [mainnet.id]: [
    'https://ethereum-rpc.publicnode.com',
    'https://eth.llamarpc.com',
    'https://1rpc.io/eth',
    'https://cloudflare-eth.com',
  ],
  [sepolia.id]: [
    // browser-CORS-friendly public endpoints only (rpc.sepolia.org blocks CORS).
    // NOTE: 1rpc.io/sepolia was dropped — it returns a JSON-RPC error body for
    // eth_call/simulate that viem reads as a CONTRACT REVERT (not a transport
    // error), so the fallback never advances and v4 quotes spuriously failed
    // with "No liquidity pool". publicnode + drpc both serve eth_call correctly.
    'https://ethereum-sepolia-rpc.publicnode.com',
    'https://sepolia.drpc.org',
  ],
}

const PROXY_PATH: Record<number, string> = {
  [mainnet.id]: 'mainnet',
  [sepolia.id]: 'sepolia',
}

export function transportFor(chainId: number): Transport {
  const pub = PUBLIC_URLS[chainId] ?? []
  const proxy = `${BACKEND}/rpc/${PROXY_PATH[chainId] ?? 'sepolia'}`
  return fallback(
    [
      ...pub.map((u) => http(u, { timeout: 4_000, retryCount: 0 })),
      // key-holding backend proxy — keys never reach the client
      http(proxy, { timeout: 6_000, retryCount: 1 }),
    ],
    // rank endpoints by latency so the fastest reachable one is used first
    // (keeps quotes/swaps snappy instead of waiting on a slow public node)
    { rank: { interval: 60_000, sampleCount: 3, timeout: 2_000 }, retryCount: 1 },
  )
}
