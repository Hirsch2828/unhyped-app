import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Depth, Topic } from '../data/types'

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
}

const KEY = 'unhyped.prefs.v2'

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaults
    const p = { ...defaults, ...JSON.parse(raw) } as Prefs
    // Only launch topics (AI, Tesla) are live; drop older picks.
    const topics = p.topics.filter((t) => t === 'ai' || t === 'tesla')
    return { ...p, topics: topics.length ? topics : ['ai'] }
  } catch {
    return defaults
  }
}

interface Ctx {
  prefs: Prefs
  update: (p: Partial<Prefs>) => void
  toggleSave: (id: string) => boolean
  markRead: (id: string) => void
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

  const reset = () => setPrefs(defaults)

  return (
    <PrefsCtx.Provider value={{ prefs, update, toggleSave, markRead, reset }}>{children}</PrefsCtx.Provider>
  )
}

export function usePrefs() {
  const ctx = useContext(PrefsCtx)
  if (!ctx) throw new Error('usePrefs outside provider')
  return ctx
}
