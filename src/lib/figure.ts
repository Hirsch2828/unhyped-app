// Which anatomy figure a story gets, and which word in its headline the highlighter marks.
// Rule order (the first that fits wins):
//   1. a physical product of a company we've taken apart → the object, that part lit
//   2. a service of a company drawn as a machine        → the machine, that station lit
//   3. a company, but no product named                    → the company's figure, plus the event scene beside it
//   4. no company                                         → the event scene alone
import { COMPANIES, type Company } from '../data/companies'
import type { EventKind } from '../components/anatomy/objects/events'
import type { Story } from '../data/types'

export type Pick =
  | { kind: 'company'; company: Company; part: number | null; event: EventKind; word: string | null }
  | { kind: 'event'; event: EventKind; word: string | null }

const has = (text: string, word: string) => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)

// Most specific first: a lawsuit about a launch is still a lawsuit.
const EVENTS: [EventKind, RegExp][] = [
  ['probe', /\b(sues?|sued|lawsuit|court|probe|investigat\w*|attorney general|nhtsa|recalls?|incidents?|study|survey|examines|research)\b/i],
  ['earnings', /\b(earnings|revenue|quarter(ly)?|q[1-4]|profits?|results|guidance|sales)\b/i],
  ['leadership', /\b(ceo|cfo|chief|resign\w*|steps? down|appoint\w*|board|reinstate\w*|interim|hires?|fired|exits?)\b/i],
  ['regulation', /\b(rules?|regulat\w*|bans?|export|tariffs?|law|bill|block\w*|sanctions?|eu|ftc|sec|congress|pushback|policy)\b/i],
  ['deal', /\b(acquir\w*|acquisition|deal|partners?|partnership|invest\w*|raises?|funding|merger|stake|integration|joins?)\b/i],
  ['launch', /\b(launch\w*|unveil\w*|introduc\w*|releases?|roll(s|ing)? out|opens?|announc\w*|updates?|expands?|begins?)\b/i],
]

export function eventOf(text: string): EventKind {
  return EVENTS.find(([, re]) => re.test(text))?.[0] ?? 'launch'
}

/** The slice of `title` that matches `word`, keeping the headline's own capitals. */
function sliceOf(title: string, word: string) {
  const m = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').exec(title)
  return m ? m[0] : null
}

export function pickFigure(story: Pick_<Story, 'title' | 'dek' | 'highlight'>): Pick {
  const title = story.title
  const text = `${title} ${story.dek ?? ''}`
  const event = eventOf(title)
  const company = COMPANIES.find((c) => c.match.some((m) => has(title, m))) ?? COMPANIES.find((c) => c.match.some((m) => has(text, m)))
  let word = story.highlight && title.includes(story.highlight) ? story.highlight : null
  if (!company) {
    // no company: mark a number if the headline has one, else the words that make it this kind of news
    const num = title.match(/\$?\d[\d.,]*\s?(%|bn|billion|million|gw|tb)?/i)?.[0]
    const cue = EVENTS.find(([k]) => k === event)?.[1].exec(title)?.[0]
    return { kind: 'event', event, word: word ?? (num && num.length > 1 ? num.trim() : cue ?? null) }
  }
  let part: number | null = null
  for (const [i, p] of company.parts.entries()) {
    const hit = (p.match ?? []).concat(p.name.toLowerCase()).find((w) => w && has(title, w))
    if (hit) {
      part = i
      word ??= sliceOf(title, hit)
      break
    }
  }
  word ??= sliceOf(title, company.match.find((m) => has(title, m)) ?? company.name)
  return { kind: 'company', company, part, event, word }
}

type Pick_<T, K extends keyof T> = { [P in K]?: T[P] | null } & { title: string }
