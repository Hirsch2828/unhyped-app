import { getStories } from './stories'
import { onePerThread } from './threads'
import { areas, topicInfo } from '../data/topics'
import type { Depth, Story, Topic } from '../data/types'

const minImportance: Record<Depth, number> = { essentials: 3, balanced: 2, everything: 1 }

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
/** Does a story match one of your own topics? Whole words, over the title, dek and key points. */
export function ownMatch(s: Story, kw: string) {
  const k = kw.trim()
  if (!k) return false
  return new RegExp(`(^|[^\\w])${esc(k)}($|[^\\w])`, 'i').test(`${s.title} ${s.dek} ${s.takeaways.join(' ')} ${s.whatHappened}`)
}

// Your topics at your depth, plus every story that matches one of your own topics (whatever its desk).
export function feedFor(topics: Topic[], depth: Depth, own: string[] = []): Story[] {
  return getStories().filter(
    (s) => !s.debunked && ((topics.includes(s.topic) && s.importance >= minImportance[depth]) || own.some((k) => ownMatch(s, k))),
  )
}

/** Stories this week for one of your own topics. */
export const ownStories = (kw: string) => getStories().filter((s) => !s.debunked && ownMatch(s, kw))

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
  if (filter.startsWith('own:')) return feed.filter((s) => ownMatch(s, filter.slice(4)))
  if (filter in topicInfo) return feed.filter((s) => s.topic === filter)
  return feed.filter((s) => s.area === filter)
}

// Chips shown under the hero: All, each followed topic, then the areas that have stories this week.
export function homeChips(topics: Topic[], depth: Depth, own: string[] = []) {
  const feed = feedFor(topics, depth, own)
  const chips: { id: string; name: string }[] = [{ id: 'all', name: 'All' }]
  for (const t of topics) chips.push({ id: t, name: topicInfo[t].name })
  for (const k of own) chips.push({ id: `own:${k}`, name: k })
  for (const t of topics)
    for (const a of areas[t] ?? []) if (feed.some((s) => s.topic === t && s.area === a.id)) chips.push({ id: a.id, name: a.name })
  return chips
}

export function buildHome(topics: Topic[], depth: Depth, myAreas: string[], filter = 'all', own: string[] = []) {
  const feed = applyFilter(feedFor(topics, depth, own), filter).sort((a, b) => score(b) - score(a))
  // Rotating hero: the most important fresh stories (last 48h when possible).
  const fresh = feed.filter((s) => s.hoursAgo <= 48 && s.label !== 'rumor')
  const heroes = (fresh.length >= 3 ? fresh : feed).slice(0, 5)
  const rest = feed.filter((s) => !heroes.includes(s))
  const must = rest.filter((s) => s.importance === 3 && s.label !== 'rumor').slice(0, 4)

  const rows: HomeRow[] = []
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
    id: 'trending',
    title: 'Most talked about this week',
    subtitle: 'Covered by the most outlets and communities',
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
            title: t === 'ai' ? a.name : `${t === 'tesla' ? 'Tesla' : 'Chips'}: ${a.name}`,
            subtitle: t === 'ai' ? a.desc : 'What happened. No buy or sell calls.',
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

// The daily brief: the 6 most important confirmed stories (shared by Home's banner and the Brief page).
// The 60-second scan: today's stories (or the last two days on a quiet day), most important first,
// one per event, at most 9. Rumors stay in: their low score is the point.
export function briefItems(topics: Topic[], own: string[] = [], depth: Depth = 'balanced', max = 9) {
  const all = feedFor(topics, depth, own)
  const today = all.filter((s) => s.hoursAgo <= 24)
  const pool = today.length >= 4 ? today : all.filter((s) => s.hoursAgo <= 48)
  const ranked = [...(pool.length ? pool : all)].sort(
    (a, b) => b.importance - a.importance || b.mergedCount - a.mergedCount || a.hoursAgo - b.hoursAgo,
  )
  return onePerThread(ranked, getStories()).slice(0, max)
}

/* ---------- The daily issue ---------- */

// Issue No. 1 came out on launch day; one issue per calendar day after that.
const LAUNCH = new Date(2026, 10, 9)
export function issueNo(d = new Date()) {
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.max(1, Math.round((day.getTime() - LAUNCH.getTime()) / 86400_000) + 1)
}
export const issueDate = (d = new Date()) =>
  d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })

// Evening runs from 19:00 until 06:00 on the reader's own clock.
export const isEvening = (d = new Date()) => d.getHours() >= 19 || d.getHours() < 6

export const ISSUE_SIZE = 5

// The lead carries the page: if it has no picture, swap in an equally important story that has one.
function pictureFirst(issue: Story[]) {
  const has = (s: Story) => !!s.photo || !!s.ownImage
  if (!issue.length || has(issue[0])) return issue
  const i = issue.findIndex((s) => has(s) && s.importance === issue[0].importance)
  if (i <= 0) return issue
  return [issue[i], ...issue.filter((_, j) => j !== i)]
}

// Today's issue: the most important confirmed stories of the last day (two days if the day was quiet).
// `quiet` is true when nothing new came in the last 48 hours; the issue then shows the latest stories instead.
export function todayIssue(feed: Story[]): { issue: Story[]; quiet: boolean } {
  // One story per developing event, so a busy news day isn't five versions of the same thing.
  const ranked = onePerThread(
    feed
      .filter((s) => s.label !== 'rumor')
      .sort((a, b) => b.importance - a.importance || b.mergedCount - a.mergedCount || a.hoursAgo - b.hoursAgo),
    getStories(),
  )
  const day = ranked.filter((s) => s.hoursAgo <= 24)
  const two = ranked.filter((s) => s.hoursAgo <= 48)
  if (day.length >= 3) return { issue: pictureFirst(day.slice(0, ISSUE_SIZE)), quiet: false }
  if (two.length >= 3) return { issue: pictureFirst(two.slice(0, ISSUE_SIZE)), quiet: false }
  const latest = onePerThread([...feed], getStories()).filter((s) => s.label !== 'rumor').sort((a, b) => a.hoursAgo - b.hoursAgo).slice(0, 12)
  latest.sort((a, b) => b.importance - a.importance || b.mergedCount - a.mergedCount)
  return { issue: latest.slice(0, ISSUE_SIZE), quiet: true }
}
