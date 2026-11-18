/** A topic id from the catalog (supabase/functions/_shared/catalog.ts), e.g. 'ai', 'tesla', 'oil' */
export type Topic = string
export type Label = 'official' | 'report' | 'rumor'
export type Depth = 'essentials' | 'balanced' | 'everything'

export interface Source {
  name: string
  kind: 'Company' | 'News' | 'Filing' | 'Research' | 'Social'
  url: string
  claim: string
}

export interface Story {
  id: string
  topic: Topic
  /** every catalog topic the story is about (its main topic first) */
  topics?: Topic[]
  area: string
  label: Label
  title: string
  dek: string
  whatHappened: string
  whyItMatters: string
  takeaways: string[]
  marketReaction?: string
  sources: Source[]
  mergedCount: number
  hoursAgo: number
  time: string
  importance: 1 | 2 | 3
  trending: number
  readMinutes: number
  image: string
  /** a real photo from one of the sources (official first), shown with a credit */
  photo?: string | null
  photoCredit?: string | null
  /** true when the image was drawn by AI: the UI shows an "Illustration" badge */
  illustration?: boolean
  /** false when the story only has a shared library image (then the UI shows a typographic card) */
  ownImage?: boolean
  /** the story's own drawing in the realistic comic style: it is the story's picture, shown in colour */
  comic?: boolean
  /** a real source headline that oversold the story (shown struck through); null when all were calm */
  hypeTitle?: string | null
  /** phrase inside `title` that carries the news (the lime highlighter) */
  highlight?: string | null
  /** open questions the sources themselves raise */
  uncertain?: string[]
  /** how each source relates to our summary */
  sourceNotes?: SourceNote[]
  /** checked facts, each with how many articles back it */
  claims?: { text: string; n: number }[]
  /** Why it matters, split: for the company and for its stock (facts only) */
  whyCompany?: string | null
  whyStock?: string | null
  /** dates and signals to watch next */
  watchNext?: { when: string | null; what: string }[]
  /** the strongest arguments each way, from the sources only */
  bull?: { text: string; n: number }[]
  bear?: { text: string; n: number }[]
  /** Hype vs Reality: 100 = confirmed fact, 0 = pure hype; with a reason anyone can check */
  hypeScore?: number | null
  hypeReason?: string | null
  /** the public company the story is about, for the price chart */
  ticker?: string | null
  /** the story turned out to be wrong; debunkNote says what really happened */
  debunked?: boolean
  debunkNote?: string | null
  publishedAt?: string | null
}

export interface SourceNote {
  source: string
  stance: 'agrees' | 'adds' | 'differs'
  note: string
}
