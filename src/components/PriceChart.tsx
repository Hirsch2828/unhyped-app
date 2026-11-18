// Market reaction: a small closing-price line around the story, with a dot at the story's day.
// Reports what the price did. Never a forecast, never advice.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Close {
  day: string
  close: number
}

const cache = new Map<string, Promise<Close[]>>()
const iso = (d: Date) => d.toISOString().slice(0, 10)

/** The US trading day a story lands on: New York date, and the next day if it came after the 16:00 close. */
export function tradingDayOf(at: string) {
  const d = new Date(at)
  const ny = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false }).formatToParts(d)
  const get = (t: string) => ny.find((p) => p.type === t)?.value ?? '00'
  const day = new Date(`${get('year')}-${get('month')}-${get('day')}T12:00:00Z`)
  if (Number(get('hour')) >= 16) day.setUTCDate(day.getUTCDate() + 1)
  return iso(day)
}

function loadCloses(ticker: string, from: string, to: string) {
  const key = `${ticker}:${from}:${to}`
  if (!cache.has(key))
    cache.set(
      key,
      Promise.resolve(
        supabase.from('prices').select('day,close').eq('ticker', ticker).gte('day', from).lte('day', to).order('day', { ascending: true }),
      ).then(({ data }) => ((data as { day: string; close: number | string }[] | null) ?? []).map((r) => ({ day: r.day, close: Number(r.close) }))),
    )
  return cache.get(key)!
}

/** The window: up to 5 trading days before the story and 5 after (or up to today). */
export function windowOf(closes: Close[], storyDay: string) {
  const i = closes.findIndex((c) => c.day >= storyDay)
  const at = i === -1 ? closes.length : i // first close on or after the story day
  const before = at > 0 ? closes[at - 1] : null
  const after = i === -1 ? null : closes[at]
  const pts = closes.slice(Math.max(0, at - 5), at + 5)
  const change = before && after ? ((after.close - before.close) / before.close) * 100 : null
  return { pts, before, after, change, storyIndex: pts.findIndex((c) => c === (after ?? before)) }
}

const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const shortDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export default function PriceChart({ ticker, at }: { ticker: string; at: string }) {
  const [closes, setCloses] = useState<Close[] | null>(null)
  const storyDay = tradingDayOf(at)

  useEffect(() => {
    const d = new Date(at)
    const from = iso(new Date(d.getTime() - 12 * 86400_000))
    const to = iso(new Date(d.getTime() + 10 * 86400_000))
    let live = true
    loadCloses(ticker, from, to)
      .then((c) => live && setCloses(c))
      .catch(() => live && setCloses([]))
    return () => {
      live = false
    }
  }, [ticker, at])

  if (closes === null) return <div className="h-[132px] animate-pulse bg-ink/5" aria-hidden />
  if (closes.length < 2) return null

  const { pts, before, after, change, storyIndex } = windowOf(closes, storyDay)
  if (pts.length < 2) return null

  const W = 320
  const H = 88
  const pad = 6
  const lo = Math.min(...pts.map((p) => p.close))
  const hi = Math.max(...pts.map((p) => p.close))
  const span = hi - lo || 1
  const x = (i: number) => pad + (i * (W - pad * 2)) / (pts.length - 1)
  const y = (v: number) => pad + (1 - (v - lo) / span) * (H - pad * 2)
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.close).toFixed(1)}`).join(' ')
  const si = storyIndex >= 0 ? storyIndex : pts.length - 1
  const sign = change === null ? '' : change > 0 ? '+' : change < 0 ? '−' : ''
  const summary =
    before && after
      ? `${ticker} closed at ${money(before.close)} before the story and ${money(after.close)} after it, ${sign}${Math.abs(change!).toFixed(1)}%.`
      : before
        ? `${ticker} last closed at ${money(before.close)}. No close yet since the story.`
        : `${ticker} closing prices around the story.`

  return (
    <figure className="border border-rule p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="t-eyebrow text-ink">{ticker} · closing price</span>
        {change !== null && (
          <span className="text-[22px] font-bold tracking-[-0.02em] text-ink">
            {sign}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-auto w-full overflow-visible" role="img" aria-label={summary}>
        <line x1={x(si)} x2={x(si)} y1={0} y2={H} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" className="text-ink" />
        <path d={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="text-ink" />
        <circle cx={x(si)} cy={y(pts[si].close)} r={5} fill="var(--lime)" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" className="text-ink" />
      </svg>
      <div className="t-meta mt-2 flex justify-between text-ink-soft">
        <span>{shortDay(pts[0].day)}</span>
        <span className="text-ink">● Story · {shortDay(storyDay)}</span>
        <span>{shortDay(pts[pts.length - 1].day)}</span>
      </div>
      <figcaption className="mt-3 border-t border-rule pt-3 text-[15px] leading-[22px] text-ink">
        {summary}
        <span className="t-meta mt-1 block text-ink-soft">What happened, not advice.</span>
      </figcaption>
    </figure>
  )
}
