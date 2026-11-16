import { createServer } from 'node:http'

/**
 * $ROCKET RPC proxy — a tiny zero-dependency Node server that holds the RPC
 * API keys server-side and forwards JSON-RPC requests to the keyed providers
 * with fallback. The browser never sees the keys.
 *
 * Endpoints:
 *   GET  /health            → status + provider counts (no secrets)
 *   POST /rpc/:chain        → forward a JSON-RPC body (chain: mainnet|sepolia)
 *
 * Fallback: providers are tried in order; on a transport error or HTTP 429/5xx
 * the next provider is used. A normal JSON-RPC error (e.g. a revert) is a valid
 * response and is returned as-is.
 *
 * Run with Node 20+ (uses --env-file, global fetch, AbortSignal.timeout):
 *   node --env-file=.env index.mjs
 */

const PORT = Number(process.env.PORT || 8787)
const HOST = process.env.HOST || '127.0.0.1'
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

const ankrKeys = (process.env.ANKR_KEYS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const PUBLIC = {
  mainnet: [
    'https://ethereum-rpc.publicnode.com',
    'https://eth.llamarpc.com',
    'https://1rpc.io/eth',
    'https://cloudflare-eth.com',
  ],
  sepolia: [
    'https://ethereum-sepolia-rpc.publicnode.com',
    'https://sepolia.drpc.org',
  ],
}

function providersFor(chain) {
  // Два ката: ПЪРВО публични keyless нодове (пестят keyed квотата), ПОСЛЕ моите
  // API ключове — Ankr (ротация между тях), Infura накрая. Ключовете се ползват
  // само ако всички публични паднат.
  const pub = [...(PUBLIC[chain] || [])]
  const keyed = []
  if (chain === 'mainnet') {
    for (const k of ankrKeys) keyed.push(`https://rpc.ankr.com/eth/${k}`)
    if (process.env.INFURA_KEY) keyed.push(`https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`)
  } else if (chain === 'sepolia') {
    for (const k of ankrKeys) keyed.push(`https://rpc.ankr.com/eth_sepolia/${k}`)
    if (process.env.INFURA_KEY) keyed.push(`https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`)
  }
  return { pub, keyed }
}

async function tryOne(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    signal: AbortSignal.timeout(9000),
  })
  if (r.status === 429 || r.status === 401 || r.status === 403 || r.status >= 500) {
    throw new Error(`provider HTTP ${r.status}`)
  }
  return await r.text()
}

// ПЪРВО публичните по ред; паднат ли ВСИЧКИ → keyed с кръгова ротация (всяка
// заявка почва от следващия Ankr ключ; падне ли последният → пак от първия).
let rr = 0
async function forward(pub, keyed, body) {
  let lastErr = 'no providers configured'
  for (const url of pub) {
    try { return { ok: true, text: await tryOne(url, body) } }
    catch (e) { lastErr = e?.message || 'fetch failed' }
  }
  const n = keyed.length
  if (n > 0) {
    const start = rr++ % n
    for (let i = 0; i < n; i++) {
      const url = keyed[(start + i) % n] // wrap: след последния пак от първия
      try { return { ok: true, text: await tryOne(url, body) } }
      catch (e) { lastErr = e?.message || 'fetch failed' }
    }
  }
  return { ok: false, error: lastErr }
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'content-type')
  res.setHeader('Access-Control-Max-Age', '86400')
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > 1_000_000) reject(new Error('body too large'))
      else chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const server = createServer(async (req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  const url = new URL(req.url, `http://localhost:${PORT}`)

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' })
    return res.end(
      JSON.stringify({
        ok: true,
        providers: {
          mainnet: (() => { const p = providersFor('mainnet'); return { public: p.pub.length, keyed: p.keyed.length } })(),
          sepolia: (() => { const p = providersFor('sepolia'); return { public: p.pub.length, keyed: p.keyed.length } })(),
        },
      }),
    )
  }

  const m = url.pathname.match(/^\/rpc\/(mainnet|sepolia)$/)
  if (req.method === 'POST' && m) {
    const chain = m[1]
    const { pub, keyed } = providersFor(chain)
    if (pub.length + keyed.length === 0) {
      res.writeHead(503, { 'content-type': 'application/json' })
      return res.end(JSON.stringify({ error: `no providers for ${chain}` }))
    }
    try {
      const body = await readBody(req)
      const result = await forward(pub, keyed, body)
      if (result.ok) {
        res.writeHead(200, { 'content-type': 'application/json' })
        return res.end(result.text)
      }
      res.writeHead(502, { 'content-type': 'application/json' })
      return res.end(JSON.stringify({ error: result.error }))
    } catch (e) {
      res.writeHead(400, { 'content-type': 'application/json' })
      return res.end(JSON.stringify({ error: e?.message || 'bad request' }))
    }
  }

  res.writeHead(404, { 'content-type': 'application/json' })
  res.end(JSON.stringify({ error: 'not found' }))
})

server.listen(PORT, HOST, () => {
  console.log(`[rocket-rpc] proxy listening on http://${HOST}:${PORT}`)
  const cnt = (c) => { const x = providersFor(c); return x.pub.length + x.keyed.length }
  console.log(`[rocket-rpc] providers — mainnet:${cnt('mainnet')} sepolia:${cnt('sepolia')}`)
})
