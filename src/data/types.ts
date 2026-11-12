export type Topic = 'ai' | 'tesla' | 'robotics' | 'chips' | 'energy' | 'markets'
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
  /** true when the image was drawn by AI: the UI shows an "Illustration" badge */
  illustration?: boolean
  /** false when the story only has a shared library image (then the UI shows a typographic card) */
  ownImage?: boolean
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
}

export interface SourceNote {
  source: string
  stance: 'agrees' | 'adds' | 'differs'
  note: string
}
