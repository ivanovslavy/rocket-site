/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHAIN?: 'sepolia' | 'mainnet'
  readonly VITE_TOKEN_ADDRESS_SEPOLIA?: string
  readonly VITE_TOKEN_ADDRESS_MAINNET?: string
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string
  /** Key-holding RPC proxy base URL (server/). */
  readonly VITE_BACKEND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
