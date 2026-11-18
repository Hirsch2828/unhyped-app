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

// ---------- Writing rules, checked by code before a story goes out ----------
// A story that breaks one is rewritten once with the problems listed; if it still breaks one, a person reviews it.

export const HYPE_WORDS = [
  'revolutionary', 'revolutionize', 'game-changer', 'game changer', 'game-changing', 'groundbreaking', 'unprecedented',
  'mind-blowing', 'jaw-dropping', 'shocking', 'stunning', 'insane', 'explosive', 'bombshell', 'skyrocket', 'skyrockets',
  'plummets', 'slams', 'destroys', 'crushes', 'must-see', 'incredible', 'massive', 'huge', 'epic', 'changes everything',
]
const ADVICE = [/\bbuy\b/i, /\bsell\b(?!ers|ing point)/i, /\bbullish\b/i, /\bbearish\b/i, /price target/i, /\bwill (rise|fall|soar|drop)\b/i, /\bstrong buy\b/i]
const GENERIC_WHY = [/^this (development|news|move|update|announcement) (highlights|underscores|shows|signals|reflects)/i, /\bthe (broader|entire|wider) (industry|landscape|ecosystem)\b/i, /\bgrowing importance of\b/i, /\bin the (ever-)?evolving\b/i, /\b(can|could|may) (shift|reshape|influence|affect|impact) the (direction|future|course)\b/i, /\bprovides? (insight|a glimpse) into\b/i, /\bbroader (societal|market|industry|implications)\b/i]

export const MAX_TITLE = 80

export interface Copy { title: string; dek: string; why_it_matters: string; takeaways?: string[]; claims?: { article_ids?: unknown[] }[] }

const sentences = (s: string) => s.split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/).filter((x) => x.trim().length > 0)

/** Title Case: most words after the first start with a capital (proper nouns are fine in sentence case). */
export function isTitleCase(title: string) {
  const words = title.split(/\s+/).slice(1).filter((w) => /^[A-Za-z]{4,}$/.test(w))
  if (words.length < 3) return false
  return words.filter((w) => /^[A-Z][a-z]/.test(w)).length / words.length > 0.6
}

export function copyProblems(c: Copy, topic: string): string[] {
  const out: string[] = []
  const text = `${c.title} ${c.dek} ${c.why_it_matters} ${(c.takeaways ?? []).join(' ')}`
  if (!c.title.trim()) out.push('The title is empty.')
  if (c.title.length > MAX_TITLE) out.push(`The title is ${c.title.length} characters; keep it under ${MAX_TITLE}.`)
  if (isTitleCase(c.title)) out.push('The title is in Title Case; use sentence case (capitalise only the first word and names).')
  const hype = HYPE_WORDS.filter((w) => new RegExp(`\\b${w}\\b`, 'i').test(text))
  if (hype.length) out.push(`Hype words: ${hype.join(', ')}. Use plain, factual words.`)
  if (/!/.test(text)) out.push('No exclamation marks.')
  if (sentences(c.why_it_matters).length > 2) out.push('"why_it_matters" has more than 2 sentences.')
  if (GENERIC_WHY.some((r) => r.test(c.why_it_matters))) out.push('"why_it_matters" is generic; say who is affected and how, with something concrete from the articles.')
  if (!(c.claims ?? []).some((x) => (x.article_ids ?? []).length > 0)) out.push('No claim cites an article; every claim needs at least one article id.')
  if (topic === 'tesla' && ADVICE.some((r) => r.test(text))) out.push('Investment-advice wording (buy, sell, bullish, bearish, price targets, predictions). Report only what happened.')
  return out
}
