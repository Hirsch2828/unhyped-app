// Story store: starts with the sample stories, then swaps in live stories from Supabase if any exist.
import { useSyncExternalStore } from 'react'
import { stories as sampleStories } from '../data/stories'
import type { Label, Source, Story, Topic } from '../data/types'

import { SUPABASE_KEY, SUPABASE_URL } from './supabase'

type Mode = 'loading' | 'live' | 'sample'
// clicks: story id -> how many times it was opened in the last 7 days (anonymous count, no user data)
let state: { stories: Story[]; mode: Mode; clicks: Record<string, number> } = { stories: sampleStories, mode: 'loading', clicks: {} }
const listeners = new Set<() => void>()
const set = (next: typeof state) => {
  state = next
  listeners.forEach((l) => l())
}

export const getStories = () => state.stories
export const getClicks = () => state.clicks
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
  }
}

export async function loadLive() {
  try {
    const since = new Date(Date.now() - 7 * 24 * 3600_000).toISOString()
    const q = new URLSearchParams({
      select:
        'id,topic,area,label,importance,title,dek,takeaways,why_it_matters,what_happened,market_reaction,article_count,last_article_at,images(path,tags),articles(url,title,sources(name,tier))',
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
    if (rows.length) set({ ...state, stories: rows.map(toStory), mode: 'live' })
    else set({ ...state, stories: sampleStories, mode: 'sample' })
  } catch {
    set({ ...state, stories: sampleStories, mode: 'sample' })
  }
  loadClicks()
}

const rpc = (fn: string, body: unknown) =>
  fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${SUPABASE_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

// Most opened stories of the last 7 days. If the counter is not set up yet, the row simply stays hidden.
async function loadClicks() {
  try {
    const res = await rpc('most_clicked', { p_days: 7 })
    if (!res.ok) return
    const rows = (await res.json()) as { story_id: string; clicks: number }[]
    set({ ...state, clicks: Object.fromEntries(rows.map((r) => [r.story_id, Number(r.clicks)])) })
  } catch {
    /* counter unavailable: ignore */
  }
}

// Count one open per story per browser session. Sends only the story id.
export function recordView(id: string) {
  if (state.mode !== 'live') return
  try {
    const key = `unhyped.viewed.${id}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch {
    /* storage blocked: still count */
  }
  rpc('record_view', { p_story: id }).catch(() => {})
}
