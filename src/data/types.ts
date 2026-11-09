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
}
