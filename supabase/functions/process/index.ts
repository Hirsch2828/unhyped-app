// Group new articles into stories, then (re)write the stories that changed.
// Runs on a schedule (every 30 min). Request budget per run: 1 grouping call + up to MAX_WRITES write calls.
import { authorized, db, json } from '../_shared/db.ts'
import { generateJSON, geminiModelInUse } from '../_shared/llm.ts'
import { AREAS, CLUSTER_SYSTEM, ENRICH_SYSTEM, WRITE_SYSTEM, clusterPrompt, enrichPrompt, writePrompt } from '../_shared/prompts.ts'
import { changeNote, clampImportance, labelFor, statusFor, type Label, type Tier } from '../_shared/rules.ts'

const MAX_ARTICLES = Number(Deno.env.get('MAX_ARTICLES') ?? 25)
const MAX_WRITES = Number(Deno.env.get('MAX_WRITES') ?? 8)
const MAX_ENRICH = Number(Deno.env.get('MAX_ENRICH') ?? 10)

// Article ids belong in claims only: strip any "[a1]" / "(a1, a2)" markers from reader-facing text.
const clean = (t: unknown) =>
  String(t ?? '').replace(/\s*[[(]a\d+(?:\s*,\s*a\d+)*[\])]/g, '').replace(/\s+([.,;:])/g, '$1').trim()

interface Enriched {
  hype: string | null; highlight: string; uncertain: string[]
  sources: { id: string; stance: string; note: string }[]
}
interface Assignment { article: string; relevant: boolean; story: string | null; group: string | null }
interface Written {
  title: string; dek: string; takeaways: string[]; why_it_matters: string; what_happened: string
  claims: { text: string; article_ids: string[] }[]; importance: number; area: string; market_reaction: string | null
}

Deno.serve(async (req) => {
  if (!(await authorized(req))) return json({ error: 'unauthorized' }, 401)
  const sb = db()
  const log: string[] = []
  const started = Date.now()
  // Edge functions are stopped at 150s on the free plan: stop starting new AI calls well before that.
  const timeLeft = () => 150_000 - (Date.now() - started) > 85_000

  // ---------- 1. Group new articles ----------
  const { data: fresh } = await sb
    .from('articles')
    .select('id, topic, title, summary, sources(name, tier)')
    .is('processed_at', null)
    .order('fetched_at', { ascending: true })
    .limit(MAX_ARTICLES)

  if (fresh?.length) {
    const since = new Date(Date.now() - 72 * 3600_000).toISOString()
    const { data: recent } = await sb
      .from('stories')
      .select('id, topic, title')
      .gte('last_article_at', since)
      .neq('status', 'rejected')
      .order('last_article_at', { ascending: false })
      .limit(80)

    // Short ids keep the prompt small and stop the model from inventing uuids.
    const sid = new Map((recent ?? []).map((s, i) => [`s${i + 1}`, s.id]))
    const aid = new Map(fresh.map((a, i) => [`a${i + 1}`, a]))

    try {
      const out = await generateJSON<unknown>({
        system: CLUSTER_SYSTEM,
        prompt: clusterPrompt(
          (recent ?? []).map((s, i) => ({ id: `s${i + 1}`, topic: s.topic, title: s.title })),
          fresh.map((a, i) => ({
            id: `a${i + 1}`,
            topic: a.topic,
            // deno-lint-ignore no-explicit-any
            source: (a as any).sources?.name ?? '',
            title: a.title,
            summary: a.summary,
          })),
        ),
      })

      const newGroups = new Map<string, string>() // group key -> new story id
      const now = new Date().toISOString()
      // Models sometimes wrap the list differently: accept a bare array or any array field.
      const list = (Array.isArray(out)
        ? out
        : ((out as { assignments?: unknown }).assignments ?? Object.values(out as object).find(Array.isArray) ?? [])) as Assignment[]
      let matched = 0
      for (const asg of list) {
        const art = aid.get(String(asg.article))
        if (!art) continue
        matched++
        let storyId: string | null = null
        if (asg.relevant) {
          if (asg.story && sid.has(asg.story)) storyId = sid.get(asg.story)!
          else {
            const key = asg.group ?? `solo-${asg.article}`
            if (!newGroups.has(key)) {
              const { data: s, error } = await sb
                .from('stories')
                .insert({ topic: art.topic, title: art.title, status: 'draft', needs_rewrite: true })
                .select('id')
                .single()
              if (error) { log.push(`create story failed: ${error.message}`); continue }
              newGroups.set(key, s.id)
            }
            storyId = newGroups.get(key)!
          }
          await sb.from('stories').update({ needs_rewrite: true, last_article_at: now }).eq('id', storyId)
        }
        await sb.from('articles').update({ story_id: storyId, processed_at: now }).eq('id', art.id)
      }
      log.push(`grouped ${matched}/${fresh.length} articles, ${newGroups.size} new stories`)
      if (!matched) log.push(`unexpected grouping reply: ${JSON.stringify(out).slice(0, 400)}`)
    } catch (e) {
      log.push(`grouping failed: ${(e as Error).message}`)
    }
  }

  // ---------- 2. (Re)write changed stories ----------
  const { data: todo } = await sb
    .from('stories')
    .select('id, topic, label, status, image_id')
    .eq('needs_rewrite', true)
    .neq('status', 'rejected')
    .order('last_article_at', { ascending: false })
    .limit(MAX_WRITES)

  for (const story of todo ?? []) {
    if (!timeLeft()) { log.push('stopping early: time budget used, the rest waits for the next run'); break }
    const { data: arts } = await sb
      .from('articles')
      .select('id, title, summary, published_at, url, sources(name, tier)')
      .eq('story_id', story.id)
      .order('published_at', { ascending: true })
      .limit(12)
    if (!arts?.length) {
      await sb.from('stories').update({ needs_rewrite: false, status: 'rejected' }).eq('id', story.id)
      continue
    }
    // deno-lint-ignore no-explicit-any
    const tiers = arts.map((a) => ((a as any).sources?.tier ?? 'signal') as Tier)
    const label = labelFor(tiers)
    const ids = new Map(arts.map((a, i) => [`a${i + 1}`, a.id]))

    try {
      const w = await generateJSON<Written>({
        system: WRITE_SYSTEM,
        prompt: writePrompt(
          story.topic,
          AREAS[story.topic],
          arts.map((a, i) => ({
            id: `a${i + 1}`,
            // deno-lint-ignore no-explicit-any
            source: (a as any).sources?.name ?? '',
            tier: tiers[i],
            title: a.title,
            summary: a.summary,
            published: a.published_at,
          })),
        ),
      })

      // Never publish an empty headline: fall back to the newest article's own title.
      const title = clean(w.title) || arts[arts.length - 1].title
      // Keep only claims that cite real article ids.
      const claims = (w.claims ?? [])
        .map((c) => ({ text: c.text, article_ids: (c.article_ids ?? []).map((x) => ids.get(x)).filter(Boolean) }))
        .filter((c) => c.text && c.article_ids.length)
      const importance = clampImportance(w.importance, label)
      const area = AREAS[story.topic].includes(w.area) ? w.area : null
      // A story already approved by the editor stays published when it gets new articles.
      const status = story.status === 'published' ? 'published' : statusFor(importance, label)
      const image_id = story.image_id ?? (await pickImage(sb, story.topic, area))

      await sb.from('stories').update({
        label,
        importance,
        area,
        status,
        title: title.slice(0, 160),
        dek: clean(w.dek),
        takeaways: (w.takeaways ?? []).map(clean).filter(Boolean).slice(0, 4),
        why_it_matters: clean(w.why_it_matters),
        what_happened: clean(w.what_happened),
        market_reaction: story.topic === 'tesla' ? clean(w.market_reaction) || 'No clear market move linked to this.' : null,
        claims,
        change_note: changeNote(story.status === 'draft' ? null : (story.label as Label), label) ?? undefined,
        article_count: arts.length,
        image_id,
        needs_rewrite: false,
        enriched_at: null, // re-annotate with the new articles
        published_at: status === 'published' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq('id', story.id)
      log.push(`wrote ${story.id} (${label}, ${importance}, ${status})`)
    } catch (e) {
      log.push(`write failed for ${story.id}: ${(e as Error).message}`)
      break // likely a rate limit: stop and try again next run
    }
  }

  // ---------- 3. Annotate published stories (hype headline, highlight, open questions, source stances) ----------
  const { data: plain } = await sb
    .from('stories')
    .select('id, title, what_happened')
    .eq('status', 'published')
    .is('enriched_at', null)
    .gte('last_article_at', new Date(Date.now() - 72 * 3600_000).toISOString())
    .order('last_article_at', { ascending: false })
    .limit(MAX_ENRICH)
  for (const story of plain ?? []) {
    if (150_000 - (Date.now() - started) < 40_000) { log.push('enrich: out of time, rest waits'); break }
    const { data: arts } = await sb
      .from('articles')
      .select('title, sources(name)')
      .eq('story_id', story.id)
      .order('published_at', { ascending: true })
      .limit(20)
    // deno-lint-ignore no-explicit-any
    const list = (arts ?? []).map((a: any, i: number) => ({ id: `a${i + 1}`, source: a.sources?.name ?? 'Source', title: String(a.title) }))
    try {
      const e = list.length
        ? await generateJSON<Enriched>({ system: ENRICH_SYSTEM, prompt: enrichPrompt(story, list) })
        : ({} as Enriched)
      const byId = new Map(list.map((a) => [a.id, a]))
      const hype = e.hype ? byId.get(String(e.hype)) : undefined
      // Hype must be a real source headline, and not just our own title again.
      const useHype = hype && hype.title.trim().toLowerCase() !== String(story.title).trim().toLowerCase()
      const hl = String(e.highlight ?? '').trim()
      const seen = new Set<string>()
      const notes = (e.sources ?? [])
        .map((n) => ({ a: byId.get(String(n.id)), stance: n.stance, note: clean(n.note).slice(0, 140) }))
        .filter((n) => n.a && ['agrees', 'adds', 'differs'].includes(n.stance) && !seen.has(n.a.source) && seen.add(n.a.source))
        .map((n) => ({ source: n.a!.source, stance: n.stance, note: n.note }))
      await sb.from('stories').update({
        hype_title: useHype ? hype!.title : null,
        hype_source: useHype ? hype!.source : null,
        highlight: hl && story.title.includes(hl) ? hl : null,
        uncertain: (e.uncertain ?? []).map(clean).filter(Boolean).slice(0, 3),
        source_notes: notes,
        enriched_at: new Date().toISOString(),
      }).eq('id', story.id)
    } catch (err) {
      const msg = (err as Error).message
      log.push(`enrich failed for ${story.id}: ${msg.slice(0, 160)}`)
      // Rate limit or timeout: stop and retry next run. A malformed reply: mark it done so it can't block the queue.
      if (/Gemini \d{3}|timed out|Anthropic \d{3}/i.test(msg)) break
      await sb.from('stories').update({ enriched_at: new Date().toISOString() }).eq('id', story.id)
    }
  }
  if (plain?.length) log.push(`enrich: looked at ${plain.length}`)

  log.push(`model ${geminiModelInUse() ?? 'n/a'}, ${Math.round((Date.now() - started) / 1000)}s`)
  return json({ ok: true, log })
})

// deno-lint-ignore no-explicit-any
async function pickImage(sb: any, topic: string, area: string | null) {
  // Only the shared backup library: never another story's own illustration.
  const { data: lib } = await sb.from('images').select('id, tags').eq('topic', topic).contains('tags', ['library'])
  const { data } = lib?.length ? { data: lib } : await sb.from('images').select('id, tags').eq('topic', topic).not('tags', 'cs', '{ai}')
  if (!data?.length) return null
  const match = area ? data.filter((i: { tags: string[] }) => i.tags.includes(area)) : []
  const pool = match.length ? match : data
  return pool[Math.floor(Math.random() * pool.length)].id
}
