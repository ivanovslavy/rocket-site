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
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

const ankrKeys = (process.env.ANKR_KEYS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

function providersFor(chain) {
  const list = []
  if (chain === 'mainnet') {
    if (process.env.INFURA_KEY)
      list.push(`https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`)
    if (process.env.ALCHEMY_KEY)
      list.push(`https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`)
    for (const k of ankrKeys) list.push(`https://rpc.ankr.com/eth/${k}`)
    if (process.env.QUICKNODE_MAINNET_URL) list.push(process.env.QUICKNODE_MAINNET_URL)
  } else if (chain === 'sepolia') {
    if (process.env.ALCHEMY_SEPOLIA_URL) list.push(process.env.ALCHEMY_SEPOLIA_URL)
    if (process.env.ALCHEMY_KEY)
      list.push(`https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`)
    if (process.env.INFURA_KEY)
      list.push(`https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`)
    for (const k of ankrKeys) list.push(`https://rpc.ankr.com/eth_sepolia/${k}`)
  }
  return list
}

async function forward(urls, body) {
  let lastErr = 'no providers configured'
  for (const url of urls) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        signal: AbortSignal.timeout(9000),
      })
      if (r.status === 429 || r.status >= 500) {
        lastErr = `provider HTTP ${r.status}`
        continue // rate-limited / provider error → rotate to the next key
      }
      const text = await r.text()
      return { ok: true, text }
    } catch (e) {
      lastErr = e?.message || 'fetch failed'
      continue
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
          mainnet: providersFor('mainnet').length,
          sepolia: providersFor('sepolia').length,
        },
      }),
    )
  }

  const m = url.pathname.match(/^\/rpc\/(mainnet|sepolia)$/)
  if (req.method === 'POST' && m) {
    const chain = m[1]
    const urls = providersFor(chain)
    if (urls.length === 0) {
      res.writeHead(503, { 'content-type': 'application/json' })
      return res.end(JSON.stringify({ error: `no providers for ${chain}` }))
    }
    try {
      const body = await readBody(req)
      const result = await forward(urls, body)
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

server.listen(PORT, () => {
  console.log(`[rocket-rpc] proxy listening on http://localhost:${PORT}`)
  console.log(
    `[rocket-rpc] providers — mainnet:${providersFor('mainnet').length} sepolia:${providersFor('sepolia').length}`,
  )
})
