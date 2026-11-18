// Today's price for one of our tickers: the last price, change since yesterday's close and a 5-minute line.
// Public and read-only (the browser calls it); only tickers on our list, cached for 4 minutes per instance.
// Prices come from Yahoo's public chart API and are delayed about 15 minutes.

const TICKERS = ['NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AAPL', 'META', 'AMZN', 'AMD', 'TSM', 'INTC', 'FROG']
const TTL = 4 * 60_000
const cache = new Map<string, { at: number; body: string }>()

const headers = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, apikey, content-type',
  'cache-control': 'public, max-age=120',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers })
  const t = (new URL(req.url).searchParams.get('t') ?? '').toUpperCase()
  if (!TICKERS.includes(t)) return new Response(JSON.stringify({ error: 'unknown ticker' }), { status: 400, headers })

  const hit = cache.get(t)
  if (hit && Date.now() - hit.at < TTL) return new Response(hit.body, { headers })

  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${t}?range=1d&interval=5m`, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; UnhypedBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`Yahoo ${res.status}`)
    const data = await res.json()
    const r = data?.chart?.result?.[0]
    const meta = r?.meta ?? {}
    const times: number[] = r?.timestamp ?? []
    const closes: (number | null)[] = r?.indicators?.quote?.[0]?.close ?? []
    const points = times
      .map((ts, i) => ({ t: ts * 1000, p: closes[i] }))
      .filter((x): x is { t: number; p: number } => typeof x.p === 'number')
      .map((x) => ({ t: x.t, p: Math.round(x.p * 100) / 100 }))
    const price = typeof meta.regularMarketPrice === 'number' ? meta.regularMarketPrice : points.at(-1)?.p ?? null
    const prev = typeof meta.chartPreviousClose === 'number' ? meta.chartPreviousClose : meta.previousClose ?? null
    const period = meta.currentTradingPeriod?.regular
    const now = Date.now() / 1000
    const open = !!period && now >= period.start && now < period.end
    const body = JSON.stringify({
      ticker: t,
      price,
      prevClose: prev,
      change: price !== null && prev ? Math.round(((price - prev) / prev) * 10000) / 100 : null,
      open,
      asOf: typeof meta.regularMarketTime === 'number' ? meta.regularMarketTime * 1000 : points.at(-1)?.t ?? null,
      points,
    })
    cache.set(t, { at: Date.now(), body })
    return new Response(body, { headers })
  } catch (e) {
    // Serve the last good answer if we have one.
    if (hit) return new Response(hit.body, { headers })
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 502, headers })
  }
})
