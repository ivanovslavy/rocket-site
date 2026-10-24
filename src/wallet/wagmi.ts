import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, sepolia } from 'wagmi/chains'
import { WALLETCONNECT_PROJECT_ID, IS_MAINNET, CHAIN_ID } from '../config'
import { transportFor } from '../rpc'

/**
 * RainbowKit + wagmi config. The active chain comes from VITE_CHAIN (Sepolia
 * for testing, mainnet for launch). Each chain uses a viem fallback transport
 * (public RPCs first, keyed endpoints as fallback — see src/rpc.ts).
 *
 * Injected wallets (MetaMask, Rabby, …) work even without a WalletConnect id;
 * a real id unlocks WalletConnect / mobile.
 */
export const HAS_WALLETCONNECT = WALLETCONNECT_PROJECT_ID.length > 0

const chains = IS_MAINNET ? ([mainnet] as const) : ([sepolia] as const)

export const wagmiConfig = getDefaultConfig({
  appName: '$ROCKET',
  projectId: HAS_WALLETCONNECT ? WALLETCONNECT_PROJECT_ID : 'rocket-injected-only',
  chains,
  transports: {
    [CHAIN_ID]: transportFor(CHAIN_ID),
  },
  ssr: false,
})
