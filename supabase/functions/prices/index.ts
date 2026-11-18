// Saves daily closing prices for the public companies we cover, for the small chart next to a story.
// Runs once a day after the US market closes. Facts only: the site never gives buy or sell advice.
import { authorized, db, json } from '../_shared/db.ts'

import { ALL_TICKERS } from '../_shared/catalog.ts'

const TICKERS = ALL_TICKERS

Deno.serve(async (req) => {
  if (!(await authorized(req))) return json({ error: 'unauthorized' }, 401)
  const body = await req.json().catch(() => ({}))
  const range = body?.range === '1y' ? '1y' : '3mo'
  const sb = db()
  const log: string[] = []
  for (const t of TICKERS) {
    try {
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${t}?range=${range}&interval=1d`, {
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; news-app)' },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const r = data?.chart?.result?.[0]
      const times: number[] = r?.timestamp ?? []
      const closes: (number | null)[] = r?.indicators?.quote?.[0]?.close ?? []
      const rows = times
        .map((ts, i) => ({ ticker: t, day: new Date(ts * 1000).toISOString().slice(0, 10), close: closes[i] }))
        .filter((x) => typeof x.close === 'number' && isFinite(x.close as number))
      if (!rows.length) throw new Error('no prices')
      const { error } = await sb.from('prices').upsert(rows, { onConflict: 'ticker,day' })
      if (error) throw new Error(error.message)
      log.push(`${t}: ${rows.length}`)
    } catch (e) {
      log.push(`${t}: ${(e as Error).message}`)
    }
  }
  return json({ ok: true, log })
})
