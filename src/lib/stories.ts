// Story store: starts with the sample stories, then swaps in live stories from Supabase if any exist.
import { useSyncExternalStore } from 'react'
import { stories as sampleStories } from '../data/stories'
import type { Label, Source, SourceNote, Story, Topic } from '../data/types'

import { SUPABASE_KEY, SUPABASE_URL } from './supabase'
import { topicById } from '../../supabase/functions/_shared/catalog'

// x-client-info tells the database this build knows the full topic catalog (5j). Older builds still
// running in readers' browsers only get AI, Tesla and Nvidia stories, so they never meet a topic they can't draw.
const API_HEADERS = { apikey: SUPABASE_KEY, authorization: `Bearer ${SUPABASE_KEY}`, 'x-client-info': 'unhyped-web/5j' }

type Mode = 'loading' | 'live' | 'sample' | 'error'
// articles24h: how many articles we read in the last 24 hours (the "noise" on the issue cover).
// Nothing is shown until live stories arrive: sample stories are for local development only, never presented as news.
let state: { stories: Story[]; mode: Mode; articles24h: number | null } = { stories: [], mode: 'loading', articles24h: null }
const listeners = new Set<() => void>()
const set = (next: typeof state) => {
  state = next
  listeners.forEach((l) => l())
}

export const getStories = () => state.stories
/** Redraw everything that reads the store (used when company facts arrive). */
export const refresh = () => set({ ...state })
export const findStory = (id: string) => state.stories.find((s) => s.id === id) ?? older.get(id)

// Stories older than the 7-day window (saved long ago, or opened from a shared link). Kept apart so they
// never leak into today's feed.
const older = new Map<string, Story>()
const asked = new Set<string>()
export async function ensureStories(ids: string[]) {
  const missing = ids.filter((id) => !findStory(id) && !asked.has(id) && /^[0-9a-f-]{36}$/.test(id))
  if (!missing.length || state.mode === 'sample') return
  missing.forEach((id) => asked.add(id))
  try {
    const q = new URLSearchParams({ select: SELECT, status: 'eq.published', id: `in.(${missing.join(',')})` })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/stories?${q}`, { headers: API_HEADERS })
    if (!res.ok) return
    for (const r of (await res.json()) as Row[]) older.set(r.id, toStory(r))
    set({ ...state })
  } catch {
    /* offline: the page shows what it has */
  }
}

export function useStories() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

const kindFor: Record<string, Source['kind']> = { official: 'Company', news: 'News', signal: 'Social' }

export interface Row {
  id: string
  topic: Topic
  topics?: string[] | null
  area: string | null
  label: Label
  importance: 1 | 2 | 3
  title: string
  dek: string
  takeaways: string[]
  why_it_matters: string
  what_happened: string
  market_reaction: string | null
  article_count: number
  last_article_at: string
  images: { path: string; tags: string[] | null } | null
  articles: { url: string; title: string; image_url?: string | null; sources: { name: string; tier: string } | null }[]
  hype_title?: string | null
  highlight?: string | null
  uncertain?: string[] | null
  source_notes?: SourceNote[] | null
  claims?: { text: string; article_ids: string[] }[] | null
  why_company?: string | null
  why_stock?: string | null
  watch_next?: { when: string | null; what: string }[] | null
  bull?: { text: string; article_ids: string[] }[] | null
  bear?: { text: string; article_ids: string[] }[] | null
  hype_score?: number | null
  hype_reason?: string | null
  ticker?: string | null
  debunked?: boolean | null
  debunk_note?: string | null
  published_at?: string | null
}

// Map backend area tags to the ids the UI uses.
const areaId = (topic: string, area: string | null) =>
  !area ? '' : topic === 'tesla' && area === 'energy' ? 'tesla-energy' : topic !== 'ai' && area === 'markets' ? 'earnings' : topic === 'nvidia' && area === 'chips' ? 'gpus' : area

const fallbackImage: Record<string, string> = { ai: 'img/ai-hero.jpg', tesla: 'img/tesla-car.jpg', nvidia: 'img/chip.jpg', chips: 'img/chip.jpg', datacenters: 'img/chip.jpg', defense: 'img/policy.jpg', evs: 'img/tesla-light.jpg' }
// Until a topic has its own illustration library, a story without an image borrows one that fits its sector.
const sectorImage: Record<string, string> = { tech: 'img/robot-arm.jpg', comms: 'img/city.jpg', discretionary: 'img/city.jpg', staples: 'img/markets.jpg', energy: 'img/energy.jpg', utilities: 'img/energy.jpg', materials: 'img/energy.jpg', financials: 'img/markets.jpg', health: 'img/policy.jpg', industrials: 'img/policy.jpg', realestate: 'img/city.jpg' }

export function toStory(r: Row): Story {
  const hoursAgo = Math.max(0, Math.round((Date.now() - new Date(r.last_article_at).getTime()) / 3600_000))
  const words = `${r.dek} ${r.what_happened} ${r.why_it_matters} ${r.why_company ?? ''} ${r.why_stock ?? ''} ${r.takeaways.join(' ')}`.split(/\s+/).length
  const seen = new Set<string>()
  const sources: Source[] = []
  for (const a of r.articles ?? []) {
    const name = a.sources?.name ?? 'Source'
    if (seen.has(name)) continue
    seen.add(name)
    sources.push({ name, kind: kindFor[a.sources?.tier ?? 'signal'], url: a.url, claim: a.title })
  }
  // A real photo from the coverage: an official source's image first, then any source's.
  const withPhoto = (r.articles ?? []).filter((a) => a.image_url && /^https:\/\//.test(a.image_url))
  const pick = withPhoto.find((a) => a.sources?.tier === 'official') ?? withPhoto[0]
  return {
    id: r.id,
    topic: r.topic,
    topics: [...new Set([r.topic, ...(r.topics ?? [])])],
    area: areaId(r.topic, r.area),
    label: r.label,
    title: r.title,
    dek: r.dek,
    whatHappened: r.what_happened,
    whyItMatters: r.why_it_matters,
    takeaways: r.takeaways ?? [],
    marketReaction: r.market_reaction ?? undefined,
    sources,
    mergedCount: Math.max(r.article_count, sources.length),
    hoursAgo,
    time: new Date(r.last_article_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    importance: r.importance,
    trending: r.article_count * 10 + r.importance * 5 - hoursAgo,
    readMinutes: Math.max(1, Math.round(words / 200)),
    image: r.images?.path ?? fallbackImage[r.topic] ?? sectorImage[topicById.get(r.topic)?.sector ?? ''] ?? 'img/ai-hero.jpg',
    illustration: !!r.images?.tags?.includes('ai'),
    ownImage: !!r.images?.tags?.includes('generated'),
    comic: !!r.images?.tags?.includes('comic'),
    photo: pick?.image_url ?? null,
    photoCredit: pick ? (pick.sources?.name ?? 'Source') : null,
    hypeTitle: r.hype_title ?? null,
    highlight: r.highlight && r.title.includes(r.highlight) ? r.highlight : null,
    uncertain: r.uncertain ?? [],
    sourceNotes: r.source_notes ?? [],
    claims: (r.claims ?? []).map((c) => ({ text: c.text, n: c.article_ids?.length ?? 1 })),
    whyCompany: r.why_company ?? null,
    whyStock: r.why_stock ?? null,
    watchNext: r.watch_next ?? [],
    bull: (r.bull ?? []).map((c) => ({ text: c.text, n: c.article_ids?.length ?? 1 })),
    bear: (r.bear ?? []).map((c) => ({ text: c.text, n: c.article_ids?.length ?? 1 })),
    hypeScore: r.hype_score ?? null,
    hypeReason: r.hype_reason ?? null,
    ticker: r.ticker ?? null,
    debunked: !!r.debunked,
    debunkNote: r.debunk_note ?? null,
    publishedAt: r.published_at ?? null,
  }
}

const SELECT =
  'id,topic,topics,area,label,importance,title,dek,takeaways,why_it_matters,what_happened,market_reaction,article_count,last_article_at,images(path,tags),articles(url,title,image_url,sources(name,tier)),hype_title,highlight,uncertain,source_notes,claims,why_company,why_stock,watch_next,bull,bear,hype_score,hype_reason,ticker,debunked,debunk_note,published_at'

export async function loadLive() {
  if (state.mode === 'error') set({ ...state, mode: 'loading' })
  // Dev only: `?fixture` loads a saved snapshot of live stories (public/__fixture.json, not committed).
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('fixture')) {
    const rows = (await (await fetch('/__fixture.json')).json()) as Row[]
    // Shift times so the snapshot looks like it was taken just now.
    const newest = Math.max(...rows.map((r) => new Date(r.last_article_at).getTime()))
    const shift = Date.now() - newest - 3600_000
    for (const r of rows) r.last_article_at = new Date(new Date(r.last_article_at).getTime() + shift).toISOString()
    set({ stories: rows.map(toStory), mode: 'live', articles24h: 147 })
    return
  }
  try {
    const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString()
    const q = new URLSearchParams({
      select: SELECT,
      status: 'eq.published',
      last_article_at: `gte.${since}`,
      order: 'last_article_at.desc',
      limit: '300',
    })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/stories?${q}`, {
      headers: API_HEADERS,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const rows = (await res.json()) as Row[]
    const articles24h = await countArticles()
    if (rows.length || !import.meta.env.DEV) set({ stories: rows.map(toStory), mode: 'live', articles24h })
    else set({ stories: sampleStories, mode: 'sample', articles24h: null })
  } catch {
    if (import.meta.env.DEV) set({ stories: sampleStories, mode: 'sample', articles24h: null })
    else set({ stories: [], mode: 'error', articles24h: null })
  }
}

// Exact count of articles fetched in the last 24 hours (a HEAD request, no rows downloaded).
async function countArticles(): Promise<number | null> {
  try {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString()
    const res = await fetch(`${SUPABASE_URL}/rest/v1/articles?select=id&fetched_at=gte.${since}`, {
      method: 'HEAD',
      headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${SUPABASE_KEY}`, prefer: 'count=exact' },
    })
    const n = Number(res.headers.get('content-range')?.split('/')[1])
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}
