// Fetch every active RSS source and store new articles. Runs on a schedule (every 15 min).
import { authorized, db, json } from '../_shared/db.ts'
import { normalizeUrl, parseFeed } from '../_shared/rss.ts'

const MAX_AGE_HOURS = 72

Deno.serve(async (req) => {
  if (!(await authorized(req))) return json({ error: 'unauthorized' }, 401)
  const sb = db()
  const { data: sources, error } = await sb.from('sources').select('*').eq('active', true)
  if (error) return json({ error: error.message }, 500)

  const cutoff = Date.now() - MAX_AGE_HOURS * 3600_000
  const report: Record<string, number | string> = {}

  await Promise.all(
    (sources ?? []).map(async (s) => {
      try {
        const res = await fetch(s.url, {
          headers: { 'user-agent': 'UnhypedBot/0.1 (news reader)', accept: 'application/rss+xml, application/atom+xml, text/xml, */*' },
          signal: AbortSignal.timeout(15000),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const items = parseFeed(await res.text())
          .filter((i) => !i.publishedAt || new Date(i.publishedAt).getTime() > cutoff)
          .map((i) => ({
            source_id: s.id,
            url: normalizeUrl(i.url),
            title: i.title.slice(0, 400),
            summary: i.summary,
            published_at: i.publishedAt,
            topic: s.topic,
          }))
        if (items.length) {
          const { error: insErr, count } = await sb
            .from('articles')
            .upsert(items, { onConflict: 'url', ignoreDuplicates: true, count: 'exact' })
          if (insErr) throw new Error(insErr.message)
          report[s.name] = count ?? items.length
        } else report[s.name] = 0
        await sb.from('sources').update({ last_fetched_at: new Date().toISOString(), last_error: null }).eq('id', s.id)
      } catch (e) {
        report[s.name] = `error: ${(e as Error).message}`
        await sb.from('sources').update({ last_error: (e as Error).message.slice(0, 300) }).eq('id', s.id)
      }
    }),
  )
  return json({ ok: true, report })
})
