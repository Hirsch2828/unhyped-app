import { getStories } from './stories'
import { topicInfo } from '../data/topics'
import type { Depth, Story, Topic } from '../data/types'

const minImportance: Record<Depth, number> = { essentials: 3, balanced: 2, everything: 1 }

export function feedFor(topics: Topic[], depth: Depth): Story[] {
  return getStories().filter((s) => topics.includes(s.topic) && s.importance >= minImportance[depth])
}

const score = (s: Story) => s.importance * 100 - s.hoursAgo

export function buildHome(topics: Topic[], depth: Depth, areas: string[]) {
  const feed = [...feedFor(topics, depth)].sort((a, b) => score(b) - score(a))
  const hero = feed[0]
  const rest = feed.slice(1)

  const rows: { id: string; title: string; subtitle?: string; items: Story[] }[] = []
  rows.push({
    id: 'trending',
    title: 'Trending now',
    subtitle: 'What everyone is talking about, checked',
    items: [...rest].sort((a, b) => b.trending - a.trending).slice(0, 8),
  })
  const because = rest.filter((s) => areas.includes(s.area))
  if (because.length)
    rows.push({ id: 'because', title: 'Because you follow', subtitle: 'Based on the areas you picked', items: because })
  for (const t of topics) {
    if (t === 'ai') continue
    const items = feed.filter((s) => s.topic === t && s !== hero)
    if (items.length)
      rows.push({
        id: t,
        title: topicInfo[t].name,
        subtitle: t === 'tesla' || t === 'markets' ? 'What happened. No buy or sell calls.' : undefined,
        items,
      })
  }

  return {
    hero,
    must: rest.filter((s) => s.importance === 3 && s.label !== 'rumor').slice(0, 4),
    rows: rows.filter((r) => r.items.length > 0),
  }
}

export function timeAgo(h: number) {
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export const today = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
