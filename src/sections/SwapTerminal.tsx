import { useRef, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useSwap } from '../hooks/useSwap'
import { SWAP_COPY } from '../copy'
import { LAUNCH_VENUE } from '../config'
import { txUrl } from '../links'
import { CheckIcon, EthIcon, RocketIcon, SwapIcon } from '../components/icons'

const SLIDE_MS = 600

export function SwapTerminal() {
  const s = useSwap()
  // cumulative rotation so the flip button keeps spinning the same way
  const [spin, setSpin] = useState(0)
  const flipsRef = useRef(0)

  // refs to the two token boxes so we can physically slide them past each other
  const [flipping, setFlipping] = useState(false)
  const payRef = useRef<HTMLDivElement>(null)
  const receiveRef = useRef<HTMLDivElement>(null)

  const onFlip = () => {
    flipsRef.current += 1
    setSpin(flipsRef.current * 180)

    const pay = payRef.current
    const rec = receiveRef.current
    // fall back to an instant flip if a slide is mid-flight or refs are missing
    if (flipping || !pay || !rec) {
      s.flip()
      return
    }

    // slowly swap the two boxes: "You pay" glides down to where "You receive"
    // sits and vice-versa; the actual tokens flip once they've traded places.
    const dy = rec.offsetTop - pay.offsetTop
    const ease = `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
    setFlipping(true)
    pay.style.transition = ease
    rec.style.transition = ease
    pay.style.transform = `translateY(${dy}px)`
    rec.style.transform = `translateY(${-dy}px)`
    window.setTimeout(() => {
      s.flip() // swap symbols/values, then snap the boxes back to their slots
      pay.style.transition = 'none'
      rec.style.transition = 'none'
      pay.style.transform = ''
      rec.style.transform = ''
      requestAnimationFrame(() => {
        pay.style.transition = ''
        rec.style.transition = ''
        setFlipping(false)
      })
    }, SLIDE_MS)
  }

  return (
    <section
      id="swap"
      className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16"
    >
      <div className="pointer-events-auto w-full max-w-md">
        <div className="mb-4 text-center">
          <h2 className="font-display text-3xl font-extrabold text-white heading-glow">
            {SWAP_COPY.title}
          </h2>
          <p className="mt-1 text-sm text-rocket-cyan text-glow">{SWAP_COPY.subtitle}</p>
        </div>

        <div className="glass-card rounded-3xl p-5">
          {/* connect button — fully real */}
          <div className="mb-4 flex justify-end">
            <ConnectButton showBalance={false} accountStatus="address" chainStatus="icon" />
          </div>

          {/* FROM */}
          <div ref={payRef} className="will-change-transform">
            <Field
              key={`from-${s.fromSymbol}`}
              label="You pay"
              symbol={s.fromSymbol}
              value={s.amountIn}
              onChange={s.setAmountIn}
              balance={s.balanceLabel}
              onMax={s.isConnected ? () => s.setMax('from') : undefined}
              editable
            />
          </div>

          {/* flip — centered between the boxes; its own tall lane with margins
              so the fields never crowd or overlap the button */}
          <div className="relative my-2 flex h-9 justify-center">
            <button
              onClick={onFlip}
              aria-label="Flip direction"
              style={{ transform: `rotate(${spin}deg)` }}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-4 border-space-800 bg-rocket-violet text-white shadow-lg transition-transform duration-300 ease-out hover:bg-rocket-violet/80"
            >
              <SwapIcon className="h-4 w-4" />
            </button>
          </div>

          {/* TO */}
          <div ref={receiveRef} className="will-change-transform">
            <Field
              key={`to-${s.toSymbol}`}
              label="You receive"
              symbol={s.toSymbol}
              value={s.amountOut}
              balance={s.toBalanceLabel}
              onMax={s.isConnected ? () => s.setMax('to') : undefined}
              editable={false}
            />
          </div>

          {/* slippage */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-space-900/60 px-4 py-2.5 text-sm">
            <span className="text-white/60">Slippage tolerance</span>
            <div className="flex gap-1">
              {[0.3, 0.5, 1].map((v) => (
                <button
                  key={v}
                  onClick={() => s.setSlippage(v)}
                  className={`cursor-pointer rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                    s.slippage === v
                      ? 'bg-rocket-cyan text-space-900'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>

          {/* primary action */}
          <button
            disabled={s.actionDisabled}
            onClick={() => void s.submit()}
            className={`mt-4 w-full rounded-2xl py-4 font-display text-lg font-extrabold transition-all ${
              s.actionDisabled
                ? 'cursor-not-allowed bg-white/10 text-white/50'
                : 'cursor-pointer bg-gradient-to-r from-rocket-cyan to-rocket-violet text-space-900 hover:scale-[1.02]'
            }`}
          >
            {s.actionLabel}
          </button>

          {s.error && (
            <p className="mt-3 rounded-lg bg-rocket-pink/15 px-3 py-2 text-center text-xs text-rocket-pink ring-1 ring-rocket-pink/30">
              {s.error}
            </p>
          )}
          {s.txHash && (
            <a
              href={txUrl(s.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-rocket-green/15 px-4 py-3 ring-1 ring-rocket-green/40 transition-colors hover:bg-rocket-green/25"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-rocket-green">
                <CheckIcon className="h-4 w-4" />
                Swap confirmed
              </span>
              <span className="text-xs font-medium text-rocket-green/80">
                View transaction ↗
              </span>
            </a>
          )}

          {!s.isLive && (
            <p className="mt-3 text-center text-xs text-white/55">{SWAP_COPY.mockNote}</p>
          )}
          <p className="mt-3 text-center text-xs text-white/45">
            Live on <span className="font-semibold text-rocket-cyan">{LAUNCH_VENUE.chain}</span> ·{' '}
            <span className="font-semibold text-rocket-cyan">{LAUNCH_VENUE.dex}</span> ·
            slippage {s.slippage}%
          </p>
        </div>
      </div>
    </section>
  )
}

function Field({
  label,
  symbol,
  value,
  onChange,
  balance,
  onMax,
  editable,
}: {
  label: string
  symbol: string
  value: string
  onChange?: (v: string) => void
  balance: string
  onMax?: () => void
  editable: boolean
}) {
  return (
    <div className="animate-swap rounded-2xl bg-space-900/60 p-4 ring-1 ring-white/10">
      <div className="mb-1 flex items-center justify-between text-xs text-white/50">
        <span>{label}</span>
        <span className="flex items-center gap-2">
          Balance: {balance}
          {onMax && (
            <button
              onClick={onMax}
              className="cursor-pointer rounded-md bg-rocket-cyan/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rocket-cyan transition-colors hover:bg-rocket-cyan/40"
            >
              Max
            </button>
          )}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <input
          inputMode="decimal"
          placeholder="0.0"
          value={value}
          readOnly={!editable}
          onChange={(e) => {
            const v = e.target.value
            if (/^\d*\.?\d*$/.test(v)) onChange?.(v)
          }}
          className="w-full bg-transparent font-display text-2xl font-bold text-white outline-none placeholder:text-white/30"
        />
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-space-700 px-3 py-1.5 font-display text-sm font-bold text-white ring-1 ring-white/10">
          {symbol === 'ETH' ? (
            <EthIcon className="h-4 w-4 text-rocket-cyan" />
          ) : (
            <RocketIcon className="h-4 w-4 text-rocket-pink" />
          )}
          {symbol}
        </span>
      </div>
    </div>
  )
}
