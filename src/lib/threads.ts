import type { Story } from '../data/types'

// Story threads: the pipeline sometimes writes several stories about one developing event
// (e.g. a CEO resigns, the board answers, he says he'd return). The issue should show the event once,
// with the other developments one tap away. Grouping is by shared names in the headline.

const GENERIC = new Set([
  'AI', 'CEO', 'CFO', 'US', 'U.S.', 'EU', 'UK', 'New', 'The', 'A', 'An', 'And', 'For', 'With', 'Its', 'How', 'Why', 'What',
  'Q1', 'Q2', 'Q3', 'Q4', 'FSD', 'API', 'App', 'Apps', 'Model', 'Models', 'Agent', 'Agents', 'Study', 'Report', 'Reports',
])

// Names in a headline: runs of capitalised words ("Jensen Huang", "Hugging Face", "Nvidia"), minus generic words.
export function namesIn(title: string): string[] {
  const words = title.replace(/[’']s\b/g, '').split(/\s+/).map((w) => w.replace(/[^A-Za-z0-9&.-]/g, '').replace(/\.$/, ''))
  const out: string[] = []
  let run: string[] = []
  const flush = () => {
    if (run.length) out.push(run.join(' ').toLowerCase())
    run = []
  }
  words.forEach((w, i) => {
    const cap = /^[A-Z]/.test(w) && !GENERIC.has(w) && w.length >= 3 && !(i === 0 && COMMON_START.has(w))
    if (cap) run.push(w)
    else flush()
  })
  flush()
  return [...new Set(out)]
}
const COMMON_START = new Set(['Large', 'Small', 'Posts', 'Phone', 'Financial', 'Major', 'Researchers', 'Startups', 'Companies', 'Campaign', 'Petition', 'Reports'])

const HOURS = 72

// Same thread: two shared names, or one shared multi-word name (a person or product) on the same desk.
// The topic's own name ("Tesla" on the Tesla desk) doesn't count: every story there has it.
function sameThread(a: Story, b: Story, na: string[], nb: string[]) {
  if (Math.abs(a.hoursAgo - b.hoursAgo) > HOURS) return false
  const shared = na.filter((n) => nb.includes(n) && n !== a.topic && n !== b.topic)
  if (shared.length >= 2) return true
  return a.area === b.area && !!a.area && shared.some((n) => n.includes(' '))
}

// Head first: most important, then most covered, then newest.
const rank = (a: Story, b: Story) => b.importance - a.importance || b.mergedCount - a.mergedCount || a.hoursAgo - b.hoursAgo

let cacheKey: Story[] | null = null
let cache = new Map<string, Story[]>()

/** Every story's thread (itself included, head first). Cached per story list. */
export function threadsOf(stories: Story[]): Map<string, Story[]> {
  if (cacheKey === stories) return cache
  const names = new Map(stories.map((s) => [s.id, namesIn(s.title)]))
  const parent = new Map(stories.map((s) => [s.id, s.id]))
  const find = (x: string): string => (parent.get(x) === x ? x : find(parent.get(x)!))
  for (let i = 0; i < stories.length; i++)
    for (let j = i + 1; j < stories.length; j++) {
      const a = stories[i]
      const b = stories[j]
      if (sameThread(a, b, names.get(a.id)!, names.get(b.id)!)) parent.set(find(a.id), find(b.id))
    }
  const groups = new Map<string, Story[]>()
  for (const s of stories) {
    const r = find(s.id)
    groups.set(r, [...(groups.get(r) ?? []), s])
  }
  const out = new Map<string, Story[]>()
  for (const g of groups.values()) {
    g.sort(rank)
    for (const s of g) out.set(s.id, g)
  }
  cacheKey = stories
  cache = out
  return out
}

/** The other stories in the same thread, newest first. */
export function siblingsOf(story: Story, stories: Story[]): Story[] {
  return (threadsOf(stories).get(story.id) ?? []).filter((s) => s.id !== story.id).sort((a, b) => a.hoursAgo - b.hoursAgo)
}

/** Keep one story per thread (the first one met in `list`'s order). */
export function onePerThread(list: Story[], stories: Story[]): Story[] {
  const t = threadsOf(stories)
  const seen = new Set<Story[]>()
  return list.filter((s) => {
    const g = t.get(s.id)
    if (!g) return true
    if (seen.has(g)) return false
    seen.add(g)
    return true
  })
}
