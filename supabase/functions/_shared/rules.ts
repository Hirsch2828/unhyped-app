// Fixed product rules. These are NOT decided by the AI.

export type Tier = 'official' | 'news' | 'signal'
export type Label = 'official' | 'report' | 'rumor'

const rank: Record<Tier, number> = { signal: 0, news: 1, official: 2 }

// Label = strongest source tier among the story's articles.
export function labelFor(tiers: Tier[]): Label {
  const best = Math.max(...tiers.map((t) => rank[t]), 0)
  return best === 2 ? 'official' : best === 1 ? 'report' : 'rumor'
}

export function changeNote(prev: Label | null, next: Label): string | null {
  if (!prev || prev === next) return null
  if (next === 'official') return 'Now confirmed by an official source.'
  if (next === 'report' && prev === 'rumor') return 'Now reported by a credible outlet.'
  return null
}

// Score 3 stories wait for a human editor. Rumors are never top-importance.
export function statusFor(importance: number, label: Label): 'published' | 'pending_review' {
  return importance >= 3 && label !== 'rumor' ? 'pending_review' : 'published'
}

export function clampImportance(n: unknown, label: Label): 1 | 2 | 3 {
  const v = Math.round(Number(n))
  const i = (v >= 3 ? 3 : v <= 1 ? 1 : 2) as 1 | 2 | 3
  return label === 'rumor' ? 1 : i
}
