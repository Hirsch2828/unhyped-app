import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Depth, Label, Story, Topic } from '../data/types'

export type Theme = 'auto' | 'light' | 'dark'
/** What a story looked like when you last read it (for "Since you read this"). */
export interface Snap {
  at: number
  sources: number
  label: Label
  title: string
  takeaways: string[]
}
export const snapOf = (s: Story): Snap => ({ at: Date.now(), sources: s.mergedCount, label: s.label, title: s.title, takeaways: s.takeaways })

export interface Prefs {
  onboarded: boolean
  topics: Topic[]
  areas: string[]
  reminder: boolean
  depth: Depth
  saved: string[]
  read: string[]
  email: string | null
  briefTime: string | null
  signupDismissed: boolean
  theme: Theme
  snaps: Record<string, Snap>
  /** start of your previous visit (ms); stories newer than this count as new */
  prevVisit: number | null
  lastVisit: number | null
}

const defaults: Prefs = {
  onboarded: false,
  topics: ['ai'],
  areas: [],
  reminder: true,
  depth: 'balanced',
  saved: [],
  read: [],
  email: null,
  briefTime: null,
  signupDismissed: false,
  theme: 'auto',
  snaps: {},
  prevVisit: null,
  lastVisit: null,
}

const KEY = 'unhyped.prefs.v2'

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaults
    const p = { ...defaults, ...JSON.parse(raw) } as Prefs
    // Only launch topics (AI, Tesla) are live; drop older picks.
    const topics = p.topics.filter((t) => t === 'ai' || t === 'tesla')
    // A new visit starts after 30 minutes away: remember when the last one began.
    const now = Date.now()
    const visit = !p.lastVisit || now - p.lastVisit > 30 * 60_000 ? { prevVisit: p.lastVisit, lastVisit: now } : { lastVisit: now }
    // Keep the read snapshots small: only the last 14 days.
    const snaps = Object.fromEntries(Object.entries(p.snaps ?? {}).filter(([, v]) => now - v.at < 14 * 86400_000))
    return { ...p, ...visit, snaps, topics: topics.length ? topics : ['ai'] }
  } catch {
    return defaults
  }
}

interface Ctx {
  prefs: Prefs
  update: (p: Partial<Prefs>) => void
  toggleSave: (id: string) => boolean
  markRead: (id: string) => void
  remember: (s: Story) => void
  reset: () => void
}

const PrefsCtx = createContext<Ctx | null>(null)

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs))
    } catch {
      /* storage unavailable: keep in memory */
    }
  }, [prefs])

  const update = (p: Partial<Prefs>) => setPrefs((cur) => ({ ...cur, ...p }))

  // Returns true when the story is now saved.
  const toggleSave = (id: string) => {
    const willSave = !prefs.saved.includes(id)
    setPrefs((cur) => ({
      ...cur,
      saved: willSave ? [...cur.saved, id] : cur.saved.filter((s) => s !== id),
    }))
    return willSave
  }

  const markRead = (id: string) =>
    setPrefs((cur) => (cur.read.includes(id) ? cur : { ...cur, read: [...cur.read, id] }))

  const remember = (st: Story) =>
    setPrefs((cur) => ({
      ...cur,
      read: cur.read.includes(st.id) ? cur.read : [...cur.read, st.id],
      snaps: { ...cur.snaps, [st.id]: snapOf(st) },
    }))

  const reset = () => setPrefs(defaults)

  return (
    <PrefsCtx.Provider value={{ prefs, update, toggleSave, markRead, remember, reset }}>{children}</PrefsCtx.Provider>
  )
}

export function usePrefs() {
  const ctx = useContext(PrefsCtx)
  if (!ctx) throw new Error('usePrefs outside provider')
  return ctx
}
