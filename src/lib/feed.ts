import { getClicks, getStories } from './stories'
import { areas, topicInfo } from '../data/topics'
import type { Depth, Story, Topic } from '../data/types'

const minImportance: Record<Depth, number> = { essentials: 3, balanced: 2, everything: 1 }

export function feedFor(topics: Topic[], depth: Depth): Story[] {
  return getStories().filter((s) => topics.includes(s.topic) && s.importance >= minImportance[depth])
}

const score = (s: Story) => s.importance * 100 - s.hoursAgo
const newest = (a: Story, b: Story) => a.hoursAgo - b.hoursAgo

export interface HomeRow {
  id: string
  title: string
  subtitle?: string
  items: Story[]
}

// Home filter: 'all', a topic id ('ai', 'tesla') or an area id ('agents', 'fsd', ...).
export function applyFilter(feed: Story[], filter: string) {
  if (!filter || filter === 'all') return feed
  if (filter in topicInfo) return feed.filter((s) => s.topic === filter)
  return feed.filter((s) => s.area === filter)
}

// Chips shown under the hero: All, each followed topic, then the areas that have stories this week.
export function homeChips(topics: Topic[], depth: Depth) {
  const feed = feedFor(topics, depth)
  const chips: { id: string; name: string }[] = [{ id: 'all', name: 'All' }]
  for (const t of topics) chips.push({ id: t, name: topicInfo[t].name })
  for (const t of topics)
    for (const a of areas[t] ?? []) if (feed.some((s) => s.topic === t && s.area === a.id)) chips.push({ id: a.id, name: a.name })
  return chips
}

export function buildHome(topics: Topic[], depth: Depth, myAreas: string[], filter = 'all') {
  const feed = applyFilter(feedFor(topics, depth), filter).sort((a, b) => score(b) - score(a))
  // Rotating hero: the most important fresh stories (last 48h when possible).
  const fresh = feed.filter((s) => s.hoursAgo <= 48 && s.label !== 'rumor')
  const heroes = (fresh.length >= 3 ? fresh : feed).slice(0, 5)
  const rest = feed.filter((s) => !heroes.includes(s))
  const must = rest.filter((s) => s.importance === 3 && s.label !== 'rumor').slice(0, 4)

  const rows: HomeRow[] = []
  const clicks = getClicks()
  // Relevance: areas you picked count most, then importance, then freshness.
  const relevance = (s: Story) =>
    (myAreas.includes(s.area) ? 150 : 0) + (topics[0] === s.topic ? 20 : 0) + s.importance * 60 - s.hoursAgo
  rows.push({
    id: 'relevant',
    title: 'Most relevant for you',
    subtitle: 'Based on your topics and areas',
    items: [...rest].sort((a, b) => relevance(b) - relevance(a)),
  })
  rows.push({ id: 'latest', title: 'Latest', subtitle: 'Newest first', items: [...rest].sort(newest) })
  rows.push({
    id: 'trending-now',
    title: 'Trending right now',
    subtitle: 'Most covered in the last 24 hours',
    items: rest.filter((s) => s.hoursAgo <= 24).sort((a, b) => b.mergedCount - a.mergedCount || a.hoursAgo - b.hoursAgo),
  })
  rows.push({
    id: 'clicked',
    title: 'Most clicked this week',
    subtitle: 'What readers opened the most',
    items: [...heroes, ...rest].filter((s) => clicks[s.id]).sort((a, b) => clicks[b.id] - clicks[a.id]),
  })
  rows.push({
    id: 'trending',
    title: 'Most trending this week',
    subtitle: 'The stories with the most sources',
    items: [...rest].sort((a, b) => b.mergedCount - a.mergedCount || b.trending - a.trending),
  })
  rows.push({
    id: 'official',
    title: 'Official only',
    subtitle: 'Straight from the company, a regulator or a paper',
    items: rest.filter((s) => s.label === 'official').sort(newest),
  })
  // One row per area, unless the page is already filtered to a single area.
  if (filter === 'all' || filter in topicInfo)
    for (const t of topics) {
      if (filter !== 'all' && filter !== t) continue
      for (const a of areas[t] ?? []) {
        const items = rest.filter((s) => s.topic === t && s.area === a.id).sort(newest)
        if (items.length >= 2)
          rows.push({
            id: `area-${a.id}`,
            title: t === 'tesla' ? `Tesla: ${a.name}` : a.name,
            subtitle: t === 'tesla' ? 'What happened. No buy or sell calls.' : a.desc,
            items,
          })
      }
    }
  rows.push({
    id: 'rumors',
    title: 'Rumor watch',
    subtitle: 'Not confirmed yet. Read with care.',
    items: rest.filter((s) => s.label === 'rumor').sort(newest),
  })
  rows.push({
    id: 'earlier',
    title: 'Earlier this week',
    subtitle: 'In case you missed it',
    items: rest.filter((s) => s.hoursAgo >= 48).sort((a, b) => score(b) - score(a)),
  })

  return { heroes, must, rows: rows.filter((r) => r.items.length > 0), total: feed.length }
}

export function timeAgo(h: number) {
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export const today = () =>
  new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
