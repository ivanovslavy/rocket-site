# Deploying $ROCKET to a Hetzner server

This is the full, step-by-step plan to host the site on your Hetzner box with:

- **Apache2** serving the static build **directly from the `dist/` folder**,
- a **systemd service** running the key-holding **RPC proxy** (so API keys stay server-side),
- **Apache2 as a reverse proxy** for the proxy's `/rpc/*` endpoints,
- a **Cloudflare** domain + DNS + SSL.

## 0. The two pieces you deploy

| Piece | What it is | Where it runs |
| --- | --- | --- |
| `dist/` | The built static site (HTML/JS/CSS/images) | Served by Apache from disk |
| `server/` | A tiny zero-dependency Node RPC proxy (holds Infura/Alchemy/Ankr keys) | systemd service on `127.0.0.1:8787` |

The browser talks to `https://<domain>/rpc/<chain>`; Apache forwards that to the local proxy,
which forwards to the keyed providers. **No API key is ever shipped to the browser.**

## 1. Build locally (keys are baked at build time!)

Vite inlines every `VITE_*` value at **build** time, so set the production env BEFORE building.

In `.env` (frontend, gitignored):

```dotenv
VITE_CHAIN=sepolia                 # flip to 'mainnet' at launch (see §8)
VITE_SWAP_VERSION=v2
VITE_TOKEN_ADDRESS_SEPOLIA=0x1A15Be833cFFb8FFB6fDE21c875d5Ee2fa58e388
VITE_BACKEND_URL=https://<your-domain>   # same origin as the site → no CORS issues
VITE_WALLETCONNECT_PROJECT_ID=<your id>
```

Then build:

```bash
npm ci
npm run build          # → produces dist/
```

> Re-run `npm run build` and re-sync every time you change a `VITE_*` value.

## 2. Move the files to the server — `rsync`

`rsync` over SSH is the right tool (fast, incremental, `--delete` keeps the server clean).

```bash
# static site → web root (the dist folder Apache serves directly)
rsync -avz --delete dist/ deploy@SERVER_IP:/var/www/rocket-site/dist/

# RPC proxy (zero dependencies, so no node_modules to copy)
rsync -avz --delete --exclude node_modules --exclude .env \
  server/ deploy@SERVER_IP:/var/www/rocket-site/server/
```

Copy the proxy secrets **once**, separately, and lock the permissions (never commit/rsync the
real `server/.env` into a shared place):

```bash
scp server/.env deploy@SERVER_IP:/var/www/rocket-site/server/.env
ssh deploy@SERVER_IP 'chmod 600 /var/www/rocket-site/server/.env'
```

`server/.env` (production):

```dotenv
PORT=8787
CORS_ORIGIN=https://<your-domain>   # lock it down (was '*')
INFURA_KEY=...
ALCHEMY_KEY=...
ANKR_KEYS=key1,key2,...
# (the rest as in server/.env.example)
```

## 3. Install Node 20+ on the server (for the proxy)

```bash
ssh deploy@SERVER_IP
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v        # must be >= 20.6 (uses --env-file)
```

## 4. systemd service for the RPC proxy

`/etc/systemd/system/rocket-rpc.service`:

```ini
[Unit]
Description=$ROCKET RPC proxy
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/var/www/rocket-site/server
ExecStart=/usr/bin/node --env-file=.env index.mjs
Restart=on-failure
RestartSec=3
User=www-data
Group=www-data

# hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadOnlyPaths=/var/www/rocket-site

[Install]
WantedBy=multi-user.target
```

Enable + start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now rocket-rpc
sudo systemctl status rocket-rpc
curl -s http://127.0.0.1:8787/health      # {"ok":true,"providers":{...}}
```

## 5. Apache2 — serve `dist/` + reverse-proxy `/rpc/`

```bash
sudo apt-get install -y apache2
sudo a2enmod proxy proxy_http rewrite headers ssl
```

`/etc/apache2/sites-available/rocket.conf`:

```apache
<VirtualHost *:80>
    ServerName  your-domain.com
    ServerAlias www.your-domain.com
    RewriteEngine On
    RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName  your-domain.com
    ServerAlias www.your-domain.com

    # serve the build folder directly
    DocumentRoot /var/www/rocket-site/dist
    <Directory /var/www/rocket-site/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride None
        Require all granted
    </Directory>

    # reverse-proxy the JSON-RPC backend (API keys stay on the server)
    ProxyPreserveHost On
    ProxyPass        /rpc/   http://127.0.0.1:8787/rpc/
    ProxyPassReverse /rpc/   http://127.0.0.1:8787/rpc/
    ProxyPass        /health http://127.0.0.1:8787/health
    ProxyPassReverse /health http://127.0.0.1:8787/health

    # SPA fallback: serve index.html for any non-file, non-/rpc path
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/rpc/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ /index.html [L]

    # cache the hashed assets hard; never cache index.html
    <FilesMatch "\.(js|css|svg|png|woff2?)$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
    <FilesMatch "^index\.html$">
        Header set Cache-Control "no-cache"
    </FilesMatch>

    SSLEngine on
    SSLCertificateFile    /etc/ssl/rocket/origin.pem
    SSLCertificateKeyFile /etc/ssl/rocket/origin.key
</VirtualHost>
```

```bash
sudo a2dissite 000-default.conf
sudo a2ensite rocket.conf
sudo apache2ctl configtest && sudo systemctl reload apache2
```

## 6. Cloudflare — domain, DNS, SSL

You buy the domain in Cloudflare, so use a **Cloudflare Origin Certificate** (free, 15-year,
trusted by Cloudflare's edge) — simplest path when traffic is proxied through Cloudflare.

1. **DNS** (Cloudflare dashboard → DNS):
   - `A   @    SERVER_IP   Proxied (orange cloud)`
   - `A   www  SERVER_IP   Proxied` (or `CNAME www → @`)
2. **SSL/TLS mode**: set to **Full (strict)**.
3. **Origin certificate**: SSL/TLS → Origin Server → *Create Certificate*. Save the cert to
   `/etc/ssl/rocket/origin.pem` and the key to `/etc/ssl/rocket/origin.key` (chmod 600), then
   reload Apache. These match the `SSLCertificate*` paths above.
4. (Optional) Turn on **Always Use HTTPS** and **Auto Minify** in Cloudflare.

> Alternative without Cloudflare proxy: set the records to **DNS only (grey cloud)** and run
> `sudo certbot --apache -d your-domain.com -d www.your-domain.com` for a Let's Encrypt cert;
> certbot rewrites the SSL paths for you.

## 7. Verify

```bash
curl -I https://your-domain.com                 # 200, serves index.html
curl -s https://your-domain.com/health          # {"ok":true,...} via the proxy
```

In the browser: site loads, planets/swap work, the swap footer reads
**“Live on Ethereum · Uniswap v2 · slippage 0.3%”**, the favicon shows the rocket, and pasting
the URL into Discord/Telegram/X shows the `og-image.png` preview. (Validate OG tags with
<https://www.opengraph.xyz/> or the Twitter Card validator.)

## 8. Mainnet launch switch (when the real token is live)

1. Deploy `RocketToken` to mainnet, add a **Uniswap v2** ETH pair, lock LP.
2. Update `.env`:
   ```dotenv
   VITE_CHAIN=mainnet
   VITE_SWAP_VERSION=v2
   VITE_TOKEN_ADDRESS_MAINNET=0x<mainnet CA>
   ```
3. Update `src/links.ts` → `CONTRACT_ADDRESS_DISPLAY = '0x<mainnet CA>'`.
4. In `index.html`, change the `og:image` / `twitter:image` to **absolute** URLs
   (`https://your-domain.com/og-image.png`) for Twitter/Facebook previews.
5. `npm run build` → `rsync dist/ …` → done. (The proxy already serves mainnet.)

## 9. Token listing assets (Dexscreener / Dextools)

The generated images are ready to submit so the token renders correctly on the DEX trackers:

- **Square logo**: `public/logo-512.png` (and `logo-256.png`) — Dexscreener & Dextools token icon.
- **Banner / header**: `public/og-image.png` (1200×630) — Dexscreener "header" / social preview.
- **Favicon source**: `public/logo.svg`.

After liquidity is live the pair auto-appears on both. To attach the logo + socials:
- **Dexscreener**: token page → *Edit / Token Info* (dexscreener.com token-info form) → upload the
  square logo + header + links. Requires the token to be tradable; verification is on-chain.
- **Dextools**: *Update token info* in their dapp → upload the square logo + socials (small DEXT/ETH
  fee). Same square `logo-512.png`.

## Notes / gotchas

- **Anti-bot + v2 swaps:** during the launch window (first ~15 blocks) the token charges a
  decaying sell tax and caps wallets. Plain `swapExactTokensForETH` can revert in that window;
  normal trading after the window is a clean 0%-tax v2 swap and works as-is. (If you want the
  terminal to handle in-window sells too, switch the v2 path to the
  `…SupportingFeeOnTransferTokens` router functions.)
- **WalletConnect:** lock the project id to your domain in the WalletConnect/Reown Cloud
  dashboard (it is public in the bundle by design).
- **Rebuild rule:** any `VITE_*` change requires a fresh `npm run build` before rsync.
