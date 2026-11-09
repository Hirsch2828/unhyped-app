// Build today's brief: up to 7 published, non-rumor stories from the last 24 hours, most important first.
// Each user sees the subset that matches their topics. Runs once a day.
import { authorized, db, json } from '../_shared/db.ts'

Deno.serve(async (req) => {
  if (!(await authorized(req))) return json({ error: 'unauthorized' }, 401)
  const sb = db()
  const since = new Date(Date.now() - 24 * 3600_000).toISOString()
  const { data, error } = await sb
    .from('stories')
    .select('id, topic, importance, last_article_at')
    .eq('status', 'published')
    .neq('label', 'rumor')
    .gte('last_article_at', since)
    .order('importance', { ascending: false })
    .order('last_article_at', { ascending: false })
    .limit(14)
  if (error) return json({ error: error.message }, 500)

  // Keep a mix: at most 7 per topic so every user gets a full brief.
  const perTopic: Record<string, number> = {}
  const ids = (data ?? []).filter((s) => (perTopic[s.topic] = (perTopic[s.topic] ?? 0) + 1) <= 7).map((s) => s.id)

  const today = new Date().toISOString().slice(0, 10)
  const { error: upErr } = await sb.from('briefs').upsert({ brief_date: today, story_ids: ids }, { onConflict: 'brief_date' })
  if (upErr) return json({ error: upErr.message }, 500)
  return json({ ok: true, date: today, stories: ids.length })
})
