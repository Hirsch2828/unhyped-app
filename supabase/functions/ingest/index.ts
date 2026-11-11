// Fetch every active RSS source and store new articles. Runs on a schedule (every 15 min).
import { authorized, db, json } from '../_shared/db.ts'
import { normalizeUrl, parseFeed } from '../_shared/rss.ts'

const MAX_AGE_HOURS = 72
// Keep one busy feed (e.g. Reddit) from flooding the queue: newest N items per source per run.
const MAX_PER_SOURCE = 8
// Switch a source off after this many failed runs in a row (12 runs = 3 hours).
const MAX_FAILS = 12

// Whole-word, case-insensitive match against any keyword. Empty list = keep everything.
function keywordFilter(words: string[] | null) {
  if (!words?.length) return () => true
  const esc = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`\\b(${esc.join('|')})\\b`, 'i')
  return (text: string) => re.test(text)
}

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
        const matches = keywordFilter(s.keywords)
        const items = parseFeed(await res.text())
          .filter((i) => !i.publishedAt || new Date(i.publishedAt).getTime() > cutoff)
          .filter((i) => matches(`${i.title} ${i.summary}`))
          .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
          .slice(0, MAX_PER_SOURCE)
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
        await sb.from('sources').update({ last_fetched_at: new Date().toISOString(), last_error: null, fail_count: 0 }).eq('id', s.id)
      } catch (e) {
        const msg = (e as Error).message.slice(0, 250)
        const fails = (s.fail_count ?? 0) + 1
        const off = fails >= MAX_FAILS
        report[s.name] = `error: ${msg}${off ? ' (switched off)' : ''}`
        await sb
          .from('sources')
          .update({
            fail_count: fails,
            last_error: off ? `auto-disabled after ${fails} failures in a row: ${msg}` : msg,
            ...(off ? { active: false } : {}),
          })
          .eq('id', s.id)
      }
    }),
  )
  return json({ ok: true, report })
})
