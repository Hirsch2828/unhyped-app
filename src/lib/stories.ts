// Story store: starts with the sample stories, then swaps in live stories from Supabase if any exist.
import { useSyncExternalStore } from 'react'
import { stories as sampleStories } from '../data/stories'
import type { Label, Source, SourceNote, Story, Topic } from '../data/types'

import { SUPABASE_KEY, SUPABASE_URL } from './supabase'

type Mode = 'loading' | 'live' | 'sample'
// articles24h: how many articles we read in the last 24 hours (the "noise" on the issue cover).
let state: { stories: Story[]; mode: Mode; articles24h: number | null } = { stories: sampleStories, mode: 'loading', articles24h: null }
const listeners = new Set<() => void>()
const set = (next: typeof state) => {
  state = next
  listeners.forEach((l) => l())
}

export const getStories = () => state.stories
export const findStory = (id: string) => state.stories.find((s) => s.id === id)

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
  articles: { url: string; title: string; sources: { name: string; tier: string } | null }[]
  hype_title?: string | null
  highlight?: string | null
  uncertain?: string[] | null
  source_notes?: SourceNote[] | null
  claims?: { text: string; article_ids: string[] }[] | null
}

// Map backend area tags to the ids the UI uses.
const areaId = (topic: string, area: string | null) =>
  !area ? '' : topic === 'tesla' && area === 'energy' ? 'tesla-energy' : topic === 'tesla' && area === 'markets' ? 'earnings' : area

const fallbackImage: Record<string, string> = { ai: 'img/ai-hero.jpg', tesla: 'img/tesla-car.jpg' }

export function toStory(r: Row): Story {
  const hoursAgo = Math.max(0, Math.round((Date.now() - new Date(r.last_article_at).getTime()) / 3600_000))
  const words = `${r.dek} ${r.what_happened} ${r.why_it_matters} ${r.takeaways.join(' ')}`.split(/\s+/).length
  const seen = new Set<string>()
  const sources: Source[] = []
  for (const a of r.articles ?? []) {
    const name = a.sources?.name ?? 'Source'
    if (seen.has(name)) continue
    seen.add(name)
    sources.push({ name, kind: kindFor[a.sources?.tier ?? 'signal'], url: a.url, claim: a.title })
  }
  return {
    id: r.id,
    topic: r.topic,
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
    image: r.images?.path ?? fallbackImage[r.topic] ?? 'img/ai-hero.jpg',
    illustration: !!r.images?.tags?.includes('ai'),
    ownImage: !!r.images?.tags?.includes('generated'),
    hypeTitle: r.hype_title ?? null,
    highlight: r.highlight && r.title.includes(r.highlight) ? r.highlight : null,
    uncertain: r.uncertain ?? [],
    sourceNotes: r.source_notes ?? [],
    claims: (r.claims ?? []).map((c) => ({ text: c.text, n: c.article_ids?.length ?? 1 })),
  }
}

export async function loadLive() {
  try {
    const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString()
    const q = new URLSearchParams({
      select:
        'id,topic,area,label,importance,title,dek,takeaways,why_it_matters,what_happened,market_reaction,article_count,last_article_at,images(path,tags),articles(url,title,sources(name,tier)),hype_title,highlight,uncertain,source_notes,claims',
      status: 'eq.published',
      last_article_at: `gte.${since}`,
      order: 'last_article_at.desc',
      limit: '300',
    })
    const res = await fetch(`${SUPABASE_URL}/rest/v1/stories?${q}`, {
      headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${SUPABASE_KEY}` },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const rows = (await res.json()) as Row[]
    const articles24h = await countArticles()
    if (rows.length) set({ stories: rows.map(toStory), mode: 'live', articles24h })
    else set({ stories: sampleStories, mode: 'sample', articles24h: null })
  } catch {
    set({ stories: sampleStories, mode: 'sample', articles24h: null })
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
