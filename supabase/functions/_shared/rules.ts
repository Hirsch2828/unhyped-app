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

// Truth rule: a story goes live only when at least one article comes from an official source or an approved
// news outlet. Discovery sources (fan blogs, Hacker News) can start a story but never publish it alone.
// There is no human editor in the flow.
export function statusFor(tiers: Tier[]): 'published' | 'draft' {
  return tiers.some((t) => t === 'official' || t === 'news') ? 'published' : 'draft'
}

export function clampImportance(n: unknown, label: Label): 1 | 2 | 3 {
  const v = Math.round(Number(n))
  const i = (v >= 3 ? 3 : v <= 1 ? 1 : 2) as 1 | 2 | 3
  return label === 'rumor' ? 1 : i
}

// ---------- Writing rules, checked by code before a story goes out ----------
// A story that breaks one is rewritten once with the problems listed; if it still breaks one, it stays a draft.

export const HYPE_WORDS = [
  'revolutionary', 'revolutionize', 'game-changer', 'game changer', 'game-changing', 'groundbreaking', 'unprecedented',
  'mind-blowing', 'jaw-dropping', 'shocking', 'stunning', 'insane', 'explosive', 'bombshell', 'skyrocket', 'skyrockets',
  'plummets', 'slams', 'destroys', 'crushes', 'must-see', 'incredible', 'massive', 'huge', 'epic', 'changes everything',
]
const ADVICE = [/\bbuy\b/i, /\bsell\b(?!ers|ing point)/i, /\bbullish\b/i, /\bbearish\b/i, /price target/i, /\bwill (rise|fall|soar|drop)\b/i, /\bstrong buy\b/i]
// Advice wording that is never fine in any story ("sell" alone is: "Nvidia can't sell chips to China").
const ADVICE_ANY = [/\bbullish\b/i, /\bbearish\b/i, /price target/i, /\b(stock|shares?|price) (will|is set to|is going to) (rise|fall|soar|drop|climb)\b/i, /\bstrong (buy|sell)\b/i, /\b(buy|sell|hold) (the |its )?(stock|shares)\b/i, /\bgood time to (buy|sell|invest)\b/i]
const GENERIC_WHY = [/^this (development|news|move|update|announcement) (highlights|underscores|shows|signals|reflects)/i, /\bthe (broader|entire|wider) (industry|landscape|ecosystem)\b/i, /\bgrowing importance of\b/i, /\bin the (ever-)?evolving\b/i, /\b(can|could|may) (shift|reshape|influence|affect|impact) the (direction|future|course)\b/i, /\bprovides? (insight|a glimpse) into\b/i, /\bbroader (societal|market|industry|implications)\b/i]

export const MAX_TITLE = 80

export interface Copy { title: string; dek: string; why_it_matters: string; takeaways?: string[]; claims?: { article_ids?: unknown[] }[]; why_company?: string | null; why_stock?: string | null; bull?: { text?: string }[]; bear?: { text?: string }[] }

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
  // Everything about the company or its stock is checked for advice wording, whatever the topic.
  const money = `${text} ${c.why_company ?? ''} ${c.why_stock ?? ''} ${[...(c.bull ?? []), ...(c.bear ?? [])].map((x) => x.text ?? '').join(' ')}`
  if (!c.title.trim()) out.push('The title is empty.')
  if (c.title.length > MAX_TITLE) out.push(`The title is ${c.title.length} characters; keep it under ${MAX_TITLE}.`)
  if (isTitleCase(c.title)) out.push('The title is in Title Case; use sentence case (capitalise only the first word and names).')
  const hype = HYPE_WORDS.filter((w) => new RegExp(`\\b${w}\\b`, 'i').test(text))
  if (hype.length) out.push(`Hype words: ${hype.join(', ')}. Use plain, factual words.`)
  if (/!/.test(text)) out.push('No exclamation marks.')
  if (sentences(c.why_it_matters).length > 2) out.push('"why_it_matters" has more than 2 sentences.')
  if (GENERIC_WHY.some((r) => r.test(c.why_it_matters))) out.push('"why_it_matters" is generic; say who is affected and how, with something concrete from the articles.')
  if (/\bthe (articles?|input|provided (text|articles?))\b/i.test(money)) out.push('Do not mention "the articles" or "the input"; write to the reader and leave out what is not known.')
  if (!(c.claims ?? []).some((x) => (x.article_ids ?? []).length > 0)) out.push('No claim cites an article; every claim needs at least one article id.')
  if ((topic === 'tesla' && ADVICE.some((r) => r.test(text))) || ADVICE_ANY.some((r) => r.test(money))) out.push('Investment-advice wording (buy, sell, bullish, bearish, price targets, predictions). Report only what happened.')
  return out
}

// ---------- Hype vs Reality ----------
// 100 = confirmed by the company itself and widely reported; 0 = an unconfirmed claim with an overhyped headline.
// Computed from the sources, never by the AI, so the reason can always be checked.
export function hypeScore(o: { tiers: Tier[]; sources: number; hypeHeadline: boolean; openQuestions: number }) {
  const label = labelFor(o.tiers)
  const officials = o.tiers.filter((t) => t === 'official').length
  const news = o.tiers.filter((t) => t === 'news').length
  let score = label === 'official' ? 78 : label === 'report' ? 52 : 18
  score += Math.min(Math.max(o.sources - 1, 0), 5) * 4 // more independent outlets
  if (o.hypeHeadline) score -= 14
  score -= Math.min(o.openQuestions, 3) * 4
  score = Math.max(3, Math.min(98, score))
  const parts = [
    `${o.sources} ${o.sources === 1 ? 'source' : 'sources'}`,
    officials ? `${officials} official` : news ? 'no official confirmation' : 'only social posts and forums',
  ]
  const tail = o.hypeHeadline ? 'At least one headline oversold it.' : 'Headlines stayed close to the facts.'
  const open = o.openQuestions ? ` ${o.openQuestions} open ${o.openQuestions === 1 ? 'question' : 'questions'}.` : ''
  return { score, reason: `${parts.join(', ')}. ${tail}${open}` }
}
