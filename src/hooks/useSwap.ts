import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useAccount,
  useBalance,
  useChainId,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from 'wagmi'
import { formatUnits, parseUnits, type Address } from 'viem'
import {
  CHAIN_ID,
  MOCK_RATE_ROCKET_PER_ETH,
  TOKEN_ADDRESS,
  TOKEN_DECIMALS,
  TOKEN_SYMBOL,
  CHAIN,
  DEFAULT_DEADLINE_MINUTES,
  DEFAULT_SLIPPAGE,
  PERMIT2_ADDRESS,
  SWAP_VERSION,
  UNIVERSAL_ROUTER_ADDRESS,
} from '../config'
import { ERC20_ABI, PERMIT2_ABI } from '../abis'
import { buildSwapTx, quote as quoteRoute, sellSpender } from '../swap/routes'

export type Direction = 'buy' | 'sell' // buy = ETH→ROCKET, sell = ROCKET→ETH

/** Permit2 amounts are uint160 (bigint); expiration is uint48 (viem → number). */
const MAX_UINT160 = (1n << 160n) - 1n
const PERMIT2_EXPIRATION = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 // 30 days
export type SwapStatus =
  | 'idle'
  | 'quoting'
  | 'approving'
  | 'swapping'
  | 'success'
  | 'error'

export interface SwapState {
  isLive: boolean
  direction: Direction
  amountIn: string
  amountOut: string
  slippage: number
  status: SwapStatus
  error: string | null
  txHash: `0x${string}` | null
  actionLabel: string
  actionDisabled: boolean
  isConnected: boolean
  wrongChain: boolean
  needsApproval: boolean
  balanceLabel: string
  toBalanceLabel: string
  fromSymbol: string
  toSymbol: string
  chainName: string
  /** which Uniswap version the swap routes through (v2|v3|v4) */
  swapVersion: string
  setAmountIn: (v: string) => void
  setSlippage: (v: number) => void
  flip: () => void
  /** fill a field with the full token balance ('to' flips first) */
  setMax: (side: 'from' | 'to') => void
  /** runs approve when needed, otherwise the swap */
  submit: () => Promise<void>
}

/**
 * The single hook that owns all swap logic.
 *
 *  MOCK MODE (TOKEN_ADDRESS === null): fixed fake rate, full terminal, button
 *  reads "Launching soon 🚀" (disabled). Connect Wallet stays real.
 *
 *  LIVE MODE (active chain has a token address — Sepolia now): real Uniswap v3
 *  swap. Quotes via QuoterV2; ETH→token wraps ETH in the router; token→ETH
 *  approves then multicalls exactInputSingle + unwrapWETH9. RPC fail-over is
 *  handled transparently by the viem fallback transport (public → keyed).
 */
export function useSwap(): SwapState {
  const isLive = TOKEN_ADDRESS !== null
  const token = TOKEN_ADDRESS as Address

  const { address, isConnected } = useAccount()
  const connectedChainId = useChainId()
  const publicClient = usePublicClient({ chainId: CHAIN_ID })
  const { writeContractAsync } = useWriteContract()
  const { switchChainAsync } = useSwitchChain()

  const [direction, setDirection] = useState<Direction>('buy')
  const [amountIn, setAmountIn] = useState('')
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE)
  const [amountOutWei, setAmountOutWei] = useState<bigint | null>(null)
  const [status, setStatus] = useState<SwapStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)

  const wrongChain = isConnected && connectedChainId !== CHAIN_ID

  // ── balances ──────────────────────────────────────────────────────────
  const { data: ethBal } = useBalance({ address, chainId: CHAIN_ID })
  const { data: tokenBal, refetch: refetchTokenBal } = useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: isLive && !!address },
  })

  // ── allowance (only relevant for selling the token) ─────────────────────
  // The ERC-20 spender depends on the protocol version: v2 Router / SwapRouter02
  // / Permit2 (v4). For v4 we additionally check the Permit2→UniversalRouter
  // allowance below.
  const erc20Spender = sellSpender()
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: token,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, erc20Spender] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: isLive && !!address && direction === 'sell' },
  })

  // v4 only: Permit2's allowance granting the Universal Router permission to
  // pull the token. Needed in addition to the ERC-20 approve(token→Permit2).
  const { data: permit2Allowance, refetch: refetchPermit2 } = useReadContract({
    address: PERMIT2_ADDRESS,
    abi: PERMIT2_ABI,
    functionName: 'allowance',
    args: address ? [address, token, UNIVERSAL_ROUTER_ADDRESS] : undefined,
    chainId: CHAIN_ID,
    query: {
      enabled: isLive && !!address && direction === 'sell' && SWAP_VERSION === 'v4',
    },
  })

  const amountInWei = useMemo(() => {
    if (!amountIn || isNaN(parseFloat(amountIn)) || parseFloat(amountIn) <= 0)
      return 0n
    try {
      // both ETH and the 18-decimal token use 18 decimals here
      return parseUnits(amountIn, 18)
    } catch {
      return 0n
    }
  }, [amountIn])

  // ERC-20 approval to the version's spender (for v4 that spender is Permit2)
  const needsErc20Approval =
    isLive &&
    direction === 'sell' &&
    amountInWei > 0n &&
    allowance !== undefined &&
    (allowance as bigint) < amountInWei

  // v4 only: Permit2 must also be authorized to let the Universal Router pull
  // the token. permit2Allowance is [amount, expiration, nonce]; we (re)approve
  // whenever the granted amount is short. (Expiry is a 30-day window set at
  // approval time; an expired-but-funded allowance just reverts the swap sim,
  // prompting the user to re-approve.)
  const permit2Amount = permit2Allowance
    ? (permit2Allowance as readonly bigint[])[0]
    : undefined
  const needsPermit2Approval =
    isLive &&
    SWAP_VERSION === 'v4' &&
    direction === 'sell' &&
    amountInWei > 0n &&
    !needsErc20Approval &&
    permit2Amount !== undefined &&
    permit2Amount < amountInWei

  const needsApproval = needsErc20Approval || needsPermit2Approval

  // ── live quote (debounced) ──────────────────────────────────────────────
  const quoteSeq = useRef(0)
  useEffect(() => {
    if (!isLive || amountInWei <= 0n || !publicClient) {
      setAmountOutWei(null)
      return
    }
    const seq = ++quoteSeq.current
    setStatus('quoting')
    setError(null)
    const id = setTimeout(async () => {
      try {
        // routes.ts picks v2 getAmountsOut / v3 QuoterV2 / v4 V4Quoter
        const out = await quoteRoute(publicClient, direction, amountInWei)
        if (seq !== quoteSeq.current) return // stale
        setAmountOutWei(out)
        setStatus('idle')
      } catch (e) {
        if (seq !== quoteSeq.current) return
        // surface the real revert in the console — the UI message is generic
        console.error('[swap quote failed]', e)
        setAmountOutWei(null)
        setStatus('idle')
        setError(quoteErrorMessage(e))
      }
    }, 350)
    return () => clearTimeout(id)
  }, [isLive, amountInWei, direction, publicClient])

  // ── mock quote (TOKEN_ADDRESS === null) ─────────────────────────────────
  const mockOut = useMemo(() => {
    const n = parseFloat(amountIn)
    if (isLive || !amountIn || isNaN(n) || n <= 0) return ''
    const out = direction === 'buy' ? n * MOCK_RATE_ROCKET_PER_ETH : n / MOCK_RATE_ROCKET_PER_ETH
    return formatNice(out)
  }, [amountIn, direction, isLive])

  const amountOut = isLive
    ? amountOutWei != null
      ? formatNice(parseFloat(formatUnits(amountOutWei, 18)))
      : ''
    : mockOut

  const fromSymbol = direction === 'buy' ? 'ETH' : TOKEN_SYMBOL
  const toSymbol = direction === 'buy' ? TOKEN_SYMBOL : 'ETH'

  const labelFor = useCallback(
    (sym: string) => {
      if (!isConnected) return '—'
      if (sym === 'ETH') {
        return ethBal
          ? `${parseFloat(formatUnits(ethBal.value, ethBal.decimals)).toFixed(4)} ETH`
          : '0.0000 ETH'
      }
      if (!isLive) return '—'
      return tokenBal != null
        ? `${formatNice(parseFloat(formatUnits(tokenBal as bigint, TOKEN_DECIMALS)))} ${TOKEN_SYMBOL}`
        : `0 ${TOKEN_SYMBOL}`
    },
    [isConnected, ethBal, tokenBal, isLive],
  )
  const balanceLabel = labelFor(fromSymbol)
  const toBalanceLabel = labelFor(toSymbol)

  const flip = useCallback(() => {
    setDirection((d) => (d === 'buy' ? 'sell' : 'buy'))
    setAmountIn('')
    setAmountOutWei(null)
    setError(null)
  }, [])

  // exact (full-precision) balances for the MAX buttons
  const exactBalanceOf = useCallback(
    (sym: string) => {
      if (sym === 'ETH') return ethBal ? formatUnits(ethBal.value, 18) : '0'
      return tokenBal != null ? formatUnits(tokenBal as bigint, 18) : '0'
    },
    [ethBal, tokenBal],
  )

  /** Fill the input with the full balance. 'to' flips direction so the token
   *  shown as output becomes the input. ETH keeps a small buffer for gas.
   *  NB: we set `amountIn` exactly ONCE here (no flip() reset) so the value is
   *  never clobbered by a batched re-render. */
  const setMax = useCallback(
    (side: 'from' | 'to') => {
      const sym = side === 'from' ? fromSymbol : toSymbol
      let raw = exactBalanceOf(sym)
      if (sym === 'ETH') {
        const n = Math.max(parseFloat(raw) - 0.002, 0) // leave gas
        raw = n > 0 ? n.toString() : '0'
      }
      if (side === 'to') setDirection((d) => (d === 'buy' ? 'sell' : 'buy'))
      setAmountOutWei(null)
      setError(null)
      setAmountIn(raw)
    },
    [fromSymbol, toSymbol, exactBalanceOf],
  )

  const minOut = useCallback(
    (out: bigint) => {
      const bps = BigInt(Math.round(slippage * 100)) // % → bps
      return (out * (10_000n - bps)) / 10_000n
    },
    [slippage],
  )

  const submit = useCallback(async () => {
    if (!isLive || !address || !publicClient) return
    setError(null)
    // on the wrong network, the button switches to the right chain first
    if (wrongChain) {
      try {
        await switchChainAsync({ chainId: CHAIN_ID })
      } catch {
        setError(`Please switch your wallet to ${CHAIN.name}.`)
      }
      return
    }
    try {
      // STEP 1 — ERC-20 approve to the version's spender (Permit2 for v4) when
      // selling and the allowance is short.
      if (needsErc20Approval) {
        setStatus('approving')
        // v4 approves Permit2 for the full uint160 (it re-approves per swap via
        // Permit2.approve); v2/v3 approve only the exact amount being sold.
        const approveAmount =
          SWAP_VERSION === 'v4' ? MAX_UINT160 : amountInWei
        const hash = await writeContractAsync({
          address: token,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [erc20Spender, approveAmount],
          chainId: CHAIN_ID,
        })
        await publicClient.waitForTransactionReceipt({ hash })
        await refetchAllowance()
        setStatus('idle')
        return // let the user press again
      }

      // STEP 2 — v4 only: authorize the Universal Router on Permit2.
      if (needsPermit2Approval) {
        setStatus('approving')
        const hash = await writeContractAsync({
          address: PERMIT2_ADDRESS,
          abi: PERMIT2_ABI,
          functionName: 'approve',
          args: [token, UNIVERSAL_ROUTER_ADDRESS, MAX_UINT160, PERMIT2_EXPIRATION],
          chainId: CHAIN_ID,
        })
        await publicClient.waitForTransactionReceipt({ hash })
        await refetchPermit2()
        setStatus('idle')
        return // let the user press again
      }

      // STEP 3 — the swap itself (routes.ts builds the v2/v3/v4 tx).
      if (amountInWei <= 0n || amountOutWei == null) return
      setStatus('swapping')
      const minimum = minOut(amountOutWei)
      const deadline = BigInt(
        Math.floor(Date.now() / 1000) + DEFAULT_DEADLINE_MINUTES * 60,
      )
      const tx = buildSwapTx({
        direction,
        amountInWei,
        minOut: minimum,
        recipient: address,
        deadline,
      })
      const hash = await writeContractAsync({
        address: tx.address,
        abi: tx.abi,
        functionName: tx.functionName,
        args: tx.args,
        value: tx.value,
        chainId: CHAIN_ID,
      })

      setTxHash(hash)
      await publicClient.waitForTransactionReceipt({ hash })
      setStatus('success')
      setAmountIn('')
      setAmountOutWei(null)
      void refetchTokenBal()
      setTimeout(() => setStatus('idle'), 4000)
    } catch (e) {
      setStatus('error')
      setError(txErrorMessage(e))
      setTimeout(() => setStatus('idle'), 200)
    }
  }, [
    isLive,
    address,
    publicClient,
    wrongChain,
    switchChainAsync,
    needsErc20Approval,
    needsPermit2Approval,
    erc20Spender,
    amountInWei,
    amountOutWei,
    direction,
    token,
    minOut,
    writeContractAsync,
    refetchAllowance,
    refetchPermit2,
    refetchTokenBal,
  ])

  const busy = status === 'approving' || status === 'swapping'
  const actionLabel = !isLive
    ? 'Launching soon'
    : !isConnected
      ? 'Connect Wallet'
      : wrongChain
        ? `Switch to ${CHAIN.name}`
        : status === 'approving'
          ? 'Approving…'
          : status === 'swapping'
            ? 'Swapping…'
            : status === 'success'
              ? 'Success ✓'
              : needsApproval
                ? `Approve ${TOKEN_SYMBOL}`
                : direction === 'buy'
                  ? 'Buy $ROCKET'
                  : 'Sell $ROCKET'

  // Enabled as soon as there's a valid amount + (for buys) a quote. We do NOT
  // block on status==='quoting' once a quote exists, so a slow re-quote on the
  // public RPCs never freezes the button. On the wrong network the button stays
  // enabled so it can switch chains.
  const actionDisabled =
    !isLive ||
    !isConnected ||
    busy ||
    (!wrongChain &&
      (amountInWei <= 0n || (!needsApproval && amountOutWei == null)))

  return {
    isLive,
    direction,
    amountIn,
    amountOut,
    slippage,
    status,
    error,
    txHash,
    actionLabel,
    actionDisabled,
    isConnected,
    wrongChain,
    needsApproval,
    balanceLabel,
    toBalanceLabel,
    fromSymbol,
    toSymbol,
    chainName: CHAIN.name,
    swapVersion: SWAP_VERSION,
    setAmountIn,
    setSlippage,
    flip,
    setMax,
    submit,
  }
}

// helpers ------------------------------------------------------------------
function formatNice(n: number): string {
  if (!isFinite(n)) return ''
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (n >= 1) return n.toLocaleString('en-US', { maximumFractionDigits: 6 })
  return n.toLocaleString('en-US', { maximumFractionDigits: 10 })
}

function quoteErrorMessage(e: unknown): string {
  const m = (e as Error)?.message ?? ''
  if (/revert|unexpected|0x/i.test(m))
    return 'No liquidity pool / quote available for this pair yet.'
  return 'Could not fetch a quote — RPCs may be busy, retrying.'
}

function txErrorMessage(e: unknown): string {
  const m = (e as Error)?.message ?? 'Transaction failed.'
  if (/user rejected|denied/i.test(m)) return 'Transaction rejected.'
  if (/insufficient funds/i.test(m)) return 'Insufficient funds for this swap.'
  return m.length > 120 ? m.slice(0, 120) + '…' : m
}
