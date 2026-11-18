// "Your own" topics: 1-3 word keywords matched over every story we already collect.
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { ownStories } from '../lib/feed'
import { useStories } from '../lib/stories'

export const MAX_OWN = 3

/** Clean a typed topic: 1-3 words, letters, digits and a few joiners only. */
export function cleanOwn(raw: string) {
  const words = raw
    .replace(/[^\p{L}\p{N}\s.&+-]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  return words.length && words.length <= 3 ? words.join(' ').slice(0, 32) : ''
}

export default function OwnTopics({ own, onChange, dark = false }: { own: string[]; onChange: (own: string[]) => void; dark?: boolean }) {
  useStories() // re-render when stories load, so the counts are live
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const kw = cleanOwn(text)
    if (!kw) return setError('Use 1 to 3 words, like “Bitcoin” or “Apple Vision”.')
    if (own.some((k) => k.toLowerCase() === kw.toLowerCase())) return setError(`You already follow ${kw}.`)
    if (own.length >= MAX_OWN) return setError(`Up to ${MAX_OWN} of your own topics. Remove one first.`)
    onChange([...own, kw])
    setText('')
    setError(null)
  }

  const soft = dark ? 'text-paper/75' : 'text-ink-soft'
  return (
    <div>
      <form onSubmit={add} className="flex gap-2">
        <label className="sr-only" htmlFor="own-topic">Add your own topic</label>
        <input
          id="own-topic"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Bitcoin, Apple Vision…"
          autoComplete="off"
          className={`h-11 min-w-0 flex-1 border px-3 text-[16px] outline-none ${dark ? 'border-paper/60 bg-transparent text-paper placeholder:text-paper/50 focus:border-paper' : 'border-ink bg-paper text-ink placeholder:text-ink-faint focus:border-2'}`}
        />
        <button type="submit" className={`press inline-flex h-11 shrink-0 items-center gap-1 px-3 text-[15px] font-bold ${dark ? 'bg-paper text-ink' : 'bg-ink text-paper'}`}>
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>
      {error && <p className={`mt-2 text-[14px] ${soft}`} role="alert">{error}</p>}
      {own.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {own.map((k) => {
            const n = ownStories(k).length
            return (
              <li key={k} className="flex min-h-[44px] items-center justify-between gap-3">
                <span className="min-w-0">
                  <span className="block font-semibold">{k}</span>
                  <span className={`t-meta block ${soft}`}>{n >= 3 ? `${n} stories this week` : n > 0 ? `Not much on ${k} this week: ${n} ${n === 1 ? 'story' : 'stories'}` : `Not much on ${k} this week`}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onChange(own.filter((x) => x !== k))}
                  className="press grid h-11 w-11 shrink-0 place-items-center"
                  aria-label={`Remove ${k}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
