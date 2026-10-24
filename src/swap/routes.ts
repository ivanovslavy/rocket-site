/**
 * Per-version swap routing for Uniswap v2 / v3 / v4.
 *
 * `useSwap` owns the React/wallet state; this module owns the chain-specific
 * "how do I quote and how do I build the swap tx" for each protocol version,
 * selected by `SWAP_VERSION`. Keeping it isolated means the working v3 path is
 * untouched and v2/v4 are additive.
 *
 *  - v2: classic constant-product Router02. Quote via getAmountsOut; ETH legs
 *        use swapExactETHForTokens / swapExactTokensForETH (router wraps WETH).
 *  - v3: QuoterV2 + SwapRouter02 (exactInputSingle, multicall+unwrap for sells).
 *  - v4: V4Quoter for quotes; swaps execute through the Universal Router as a
 *        single V4_SWAP command (SWAP_EXACT_IN_SINGLE → SETTLE_ALL → TAKE_ALL).
 *        Pools are keyed by a PoolKey (fee/tickSpacing/hooks) configured in env.
 */
import {
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  type Address,
  type PublicClient,
} from 'viem'
import {
  NATIVE_CURRENCY,
  PERMIT2_ADDRESS,
  POOL_FEE,
  QUOTER_V2_ADDRESS,
  SWAP_ROUTER_02_ADDRESS,
  SWAP_VERSION,
  TOKEN_ADDRESS,
  UNIVERSAL_ROUTER_ADDRESS,
  V2_ROUTER_ADDRESS,
  V4_FEE,
  V4_HOOKS,
  V4_QUOTER_ADDRESS,
  V4_TICK_SPACING,
  WETH_ADDRESS,
} from '../config'
import {
  QUOTER_V2_ABI,
  ROUTER_ADDRESS_THIS,
  SWAP_ROUTER_02_ABI,
  UNIVERSAL_ROUTER_ABI,
  UR_CMD_V4_SWAP,
  V2_ROUTER_ABI,
  V4_ACTION_SETTLE_ALL,
  V4_ACTION_SWAP_EXACT_IN_SINGLE,
  V4_ACTION_TAKE_ALL,
  V4_QUOTER_ABI,
} from '../abis'

export type Direction = 'buy' | 'sell' // buy = ETH→TOKEN, sell = TOKEN→ETH

/** A wagmi `writeContract` request, ready to hand to writeContractAsync. */
export interface SwapTxRequest {
  address: Address
  // viem infers the exact ABI shape from the concrete abis; `any` here keeps
  // the dispatcher simple without weakening the per-call type at the abi level.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abi: any
  functionName: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[]
  value?: bigint
}

const token = TOKEN_ADDRESS as Address

// ── v4 PoolKey ────────────────────────────────────────────────────────────
// Currencies are sorted ascending; native ETH (address(0)) always sorts first,
// so for an ETH/TOKEN pool currency0 = ETH and currency1 = TOKEN.
const v4PoolKey = {
  currency0: NATIVE_CURRENCY,
  currency1: token,
  fee: V4_FEE,
  tickSpacing: V4_TICK_SPACING,
  hooks: V4_HOOKS,
} as const

// Named so it can be nested as the `poolKey` field of ExactInputSingleParams —
// viem matches tuple components to object keys BY NAME, so an unnamed component
// would be looked up as values[undefined] → undefined → ".currency0" crash.
const POOL_KEY_ABI = {
  name: 'poolKey',
  type: 'tuple',
  components: [
    { name: 'currency0', type: 'address' },
    { name: 'currency1', type: 'address' },
    { name: 'fee', type: 'uint24' },
    { name: 'tickSpacing', type: 'int24' },
    { name: 'hooks', type: 'address' },
  ],
} as const

// buy = ETH→TOKEN = currency0→currency1 = zeroForOne true
const zeroForOne = (dir: Direction) => dir === 'buy'

// ════════════════════════════════════════════════════════════════════════
// QUOTES — return the expected output amount (wei) for `amountInWei`.
// ════════════════════════════════════════════════════════════════════════
export async function quote(
  publicClient: PublicClient,
  direction: Direction,
  amountInWei: bigint,
): Promise<bigint> {
  if (SWAP_VERSION === 'v2') return quoteV2(publicClient, direction, amountInWei)
  if (SWAP_VERSION === 'v4') return quoteV4(publicClient, direction, amountInWei)
  return quoteV3(publicClient, direction, amountInWei)
}

async function quoteV3(
  publicClient: PublicClient,
  direction: Direction,
  amountInWei: bigint,
): Promise<bigint> {
  const tokenIn = direction === 'buy' ? WETH_ADDRESS : token
  const tokenOut = direction === 'buy' ? token : WETH_ADDRESS
  const { result } = await publicClient.simulateContract({
    address: QUOTER_V2_ADDRESS,
    abi: QUOTER_V2_ABI,
    functionName: 'quoteExactInputSingle',
    args: [
      { tokenIn, tokenOut, amountIn: amountInWei, fee: POOL_FEE, sqrtPriceLimitX96: 0n },
    ],
  })
  return (result as readonly bigint[])[0]
}

async function quoteV2(
  publicClient: PublicClient,
  direction: Direction,
  amountInWei: bigint,
): Promise<bigint> {
  const path =
    direction === 'buy' ? [WETH_ADDRESS, token] : [token, WETH_ADDRESS]
  const amounts = (await publicClient.readContract({
    address: V2_ROUTER_ADDRESS,
    abi: V2_ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [amountInWei, path],
  })) as readonly bigint[]
  return amounts[amounts.length - 1]
}

async function quoteV4(
  publicClient: PublicClient,
  direction: Direction,
  amountInWei: bigint,
): Promise<bigint> {
  const { result } = await publicClient.simulateContract({
    address: V4_QUOTER_ADDRESS,
    abi: V4_QUOTER_ABI,
    functionName: 'quoteExactInputSingle',
    args: [
      {
        poolKey: v4PoolKey,
        zeroForOne: zeroForOne(direction),
        exactAmount: amountInWei,
        hookData: '0x',
      },
    ],
  })
  return (result as readonly bigint[])[0]
}

// ════════════════════════════════════════════════════════════════════════
// SWAP TX — build the writeContract request for the swap itself.
// ════════════════════════════════════════════════════════════════════════
export function buildSwapTx(args: {
  direction: Direction
  amountInWei: bigint
  minOut: bigint
  recipient: Address
  deadline: bigint
}): SwapTxRequest {
  if (SWAP_VERSION === 'v2') return buildV2(args)
  if (SWAP_VERSION === 'v4') return buildV4(args)
  return buildV3(args)
}

function buildV3({
  direction,
  amountInWei,
  minOut,
  recipient,
}: {
  direction: Direction
  amountInWei: bigint
  minOut: bigint
  recipient: Address
}): SwapTxRequest {
  if (direction === 'buy') {
    return {
      address: SWAP_ROUTER_02_ADDRESS,
      abi: SWAP_ROUTER_02_ABI,
      functionName: 'exactInputSingle',
      args: [
        {
          tokenIn: WETH_ADDRESS,
          tokenOut: token,
          fee: POOL_FEE,
          recipient,
          amountIn: amountInWei,
          amountOutMinimum: minOut,
          sqrtPriceLimitX96: 0n,
        },
      ],
      value: amountInWei,
    }
  }
  // TOKEN → ETH: swap to WETH held by the router, then unwrap to the user
  const swapData = encodeFunctionData({
    abi: SWAP_ROUTER_02_ABI,
    functionName: 'exactInputSingle',
    args: [
      {
        tokenIn: token,
        tokenOut: WETH_ADDRESS,
        fee: POOL_FEE,
        recipient: ROUTER_ADDRESS_THIS,
        amountIn: amountInWei,
        amountOutMinimum: minOut,
        sqrtPriceLimitX96: 0n,
      },
    ],
  })
  const unwrapData = encodeFunctionData({
    abi: SWAP_ROUTER_02_ABI,
    functionName: 'unwrapWETH9',
    args: [minOut, recipient],
  })
  return {
    address: SWAP_ROUTER_02_ADDRESS,
    abi: SWAP_ROUTER_02_ABI,
    functionName: 'multicall',
    args: [[swapData, unwrapData]],
  }
}

function buildV2({
  direction,
  amountInWei,
  minOut,
  recipient,
  deadline,
}: {
  direction: Direction
  amountInWei: bigint
  minOut: bigint
  recipient: Address
  deadline: bigint
}): SwapTxRequest {
  if (direction === 'buy') {
    return {
      address: V2_ROUTER_ADDRESS,
      abi: V2_ROUTER_ABI,
      functionName: 'swapExactETHForTokens',
      args: [minOut, [WETH_ADDRESS, token], recipient, deadline],
      value: amountInWei,
    }
  }
  return {
    address: V2_ROUTER_ADDRESS,
    abi: V2_ROUTER_ABI,
    functionName: 'swapExactTokensForETH',
    args: [amountInWei, minOut, [token, WETH_ADDRESS], recipient, deadline],
  }
}

/**
 * v4 via Universal Router. A single V4_SWAP command carries an encoded action
 * list: SWAP_EXACT_IN_SINGLE (do the trade) → SETTLE_ALL (pay the input
 * currency) → TAKE_ALL (collect the output currency). Buying with native ETH
 * sends `value`; selling the token requires a prior Permit2 approval (handled
 * in useSwap).
 */
function buildV4({
  direction,
  amountInWei,
  minOut,
  deadline,
}: {
  direction: Direction
  amountInWei: bigint
  minOut: bigint
  recipient: Address
  deadline: bigint
}): SwapTxRequest {
  const z = zeroForOne(direction)
  const inputCurrency = z ? v4PoolKey.currency0 : v4PoolKey.currency1
  const outputCurrency = z ? v4PoolKey.currency1 : v4PoolKey.currency0

  // action 1: SWAP_EXACT_IN_SINGLE(ExactInputSingleParams)
  const swapParams = encodeAbiParameters(
    [
      {
        type: 'tuple',
        components: [
          POOL_KEY_ABI,
          { name: 'zeroForOne', type: 'bool' },
          { name: 'amountIn', type: 'uint128' },
          { name: 'amountOutMinimum', type: 'uint128' },
          { name: 'hookData', type: 'bytes' },
        ],
      },
    ],
    [
      {
        poolKey: v4PoolKey,
        zeroForOne: z,
        amountIn: amountInWei,
        amountOutMinimum: minOut,
        hookData: '0x',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any,
  )
  // action 2: SETTLE_ALL(inputCurrency, maxAmount)
  const settleParams = encodeAbiParameters(
    [
      { name: 'currency', type: 'address' },
      { name: 'maxAmount', type: 'uint256' },
    ],
    [inputCurrency, amountInWei],
  )
  // action 3: TAKE_ALL(outputCurrency, minAmount)
  const takeParams = encodeAbiParameters(
    [
      { name: 'currency', type: 'address' },
      { name: 'minAmount', type: 'uint256' },
    ],
    [outputCurrency, minOut],
  )

  const actions = encodePacked(
    ['uint8', 'uint8', 'uint8'],
    [
      V4_ACTION_SWAP_EXACT_IN_SINGLE,
      V4_ACTION_SETTLE_ALL,
      V4_ACTION_TAKE_ALL,
    ],
  )
  // V4_SWAP input = abi.encode(bytes actions, bytes[] params)
  const v4Input = encodeAbiParameters(
    [
      { name: 'actions', type: 'bytes' },
      { name: 'params', type: 'bytes[]' },
    ],
    [actions, [swapParams, settleParams, takeParams]],
  )

  const commands = encodePacked(['uint8'], [UR_CMD_V4_SWAP])

  return {
    address: UNIVERSAL_ROUTER_ADDRESS,
    abi: UNIVERSAL_ROUTER_ABI,
    functionName: 'execute',
    args: [commands, [v4Input], deadline],
    // native ETH input is sent as value; token input is pulled via Permit2
    value: direction === 'buy' ? amountInWei : 0n,
  }
}

// ── Approvals ───────────────────────────────────────────────────────────────
/**
 * Who must hold the ERC-20 allowance when SELLING the token, per version:
 *  - v2 → the v2 Router
 *  - v3 → SwapRouter02
 *  - v4 → Permit2 (which then needs its own approval to the Universal Router;
 *         see `useSwap`). Buys (native ETH in) never need an ERC-20 approval.
 */
export function sellSpender(): Address {
  if (SWAP_VERSION === 'v2') return V2_ROUTER_ADDRESS
  if (SWAP_VERSION === 'v4') return PERMIT2_ADDRESS
  return SWAP_ROUTER_02_ADDRESS
}
