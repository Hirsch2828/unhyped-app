// Today's price under the story chart: last price, change since yesterday's close and today's line.
// Refreshes every 5 minutes while the page is visible. Delayed about 15 minutes. Never advice.
import { useEffect, useState } from 'react'
import { SUPABASE_URL } from '../lib/supabase'

interface Quote {
  ticker: string
  price: number | null
  prevClose: number | null
  change: number | null
  open: boolean
  asOf: number | null
  points: { t: number; p: number }[]
}

const EVERY = 5 * 60_000
const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function ago(ms: number) {
  const m = Math.round((Date.now() - ms) / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  return h < 24 ? `${h}h ago` : new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function LiveQuote({ ticker }: { ticker: string }) {
  const [q, setQ] = useState<Quote | null>(null)
  const [, tick] = useState(0) // re-render so "updated N min ago" stays true

  useEffect(() => {
    let live = true
    const load = () =>
      fetch(`${SUPABASE_URL}/functions/v1/quote?t=${encodeURIComponent(ticker)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d: Quote | null) => live && d && typeof d.price === 'number' && setQ(d))
        .catch(() => {})
    load()
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load()
      tick((n) => n + 1)
    }, EVERY)
    const onShow = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onShow)
    return () => {
      live = false
      clearInterval(id)
      document.removeEventListener('visibilitychange', onShow)
    }
  }, [ticker])

  if (!q || q.price === null) return null
  const pts = q.points
  const W = 120
  const H = 32
  const all = [...pts.map((p) => p.p), ...(q.prevClose ? [q.prevClose] : [])]
  const lo = Math.min(...all)
  const span = Math.max(...all) - lo || 1
  const y = (v: number) => 2 + (1 - (v - lo) / span) * (H - 4)
  const x = (i: number) => (pts.length > 1 ? (i * W) / (pts.length - 1) : 0)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.p).toFixed(1)}`).join(' ')
  const sign = q.change === null ? '' : q.change > 0 ? '+' : q.change < 0 ? '−' : ''
  const status = q.open ? 'Market open' : 'Market closed'

  return (
    <div className="mt-3 flex items-center gap-4 border border-rule px-4 py-3" aria-live="polite">
      <div className="min-w-0 flex-1">
        <p className="t-eyebrow text-ink">
          {ticker} today
          <span className="ml-2 inline-flex items-center gap-1 text-ink-soft">
            <span aria-hidden className={`inline-block h-1.5 w-1.5 rounded-full ${q.open ? 'bg-ink' : 'border border-ink'}`} />
            {status}
          </span>
        </p>
        <p className="mt-1 text-ink">
          <span className="text-[20px] font-bold tracking-[-0.02em]">{money(q.price)}</span>
          {q.change !== null && (
            <span className="ml-2 font-semibold">
              {sign}
              {Math.abs(q.change).toFixed(2)}%
            </span>
          )}
        </p>
        <p className="t-meta mt-0.5 text-ink-soft">
          {q.asOf ? `Updated ${ago(q.asOf)}` : 'Updated today'} · delayed ~15 min · not advice
        </p>
      </div>
      {pts.length > 1 && (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-8 w-[120px] shrink-0 overflow-visible" aria-hidden>
          {q.prevClose && (
            <line x1={0} x2={W} y1={y(q.prevClose)} y2={y(q.prevClose)} stroke="currentColor" strokeOpacity={0.3} strokeDasharray="2 3" className="text-ink" />
          )}
          <path d={line} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinejoin="round" className="text-ink" />
        </svg>
      )}
    </div>
  )
}
