import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check as CheckIcon, RotateCcw } from 'lucide-react'
import type { Depth, Topic } from '../data/types'
import { allTopics, areas, depthInfo, topicInfo } from '../data/topics'
import { usePrefs } from '../lib/prefs'
import { Check } from '../components/ui'

const times = ['07:00', '08:00', '12:30', '18:00', '21:00']

export default function Settings() {
  const { prefs, update, reset } = usePrefs()
  const nav = useNavigate()
  const [toast, setToast] = useState(false)
  const first = useRef(true)

  // Show "Preferences updated" after any change (saved automatically).
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setToast(true)
    const t = setTimeout(() => setToast(false), 2000)
    return () => clearTimeout(t)
  }, [prefs.topics, prefs.areas, prefs.depth, prefs.briefTime, prefs.reminder])

  const toggleTopic = (t: Topic) => {
    const next = prefs.topics.includes(t) ? prefs.topics.filter((x) => x !== t) : [...prefs.topics, t]
    if (next.length) update({ topics: next })
  }
  const toggleArea = (a: string) =>
    update({ areas: prefs.areas.includes(a) ? prefs.areas.filter((x) => x !== a) : [...prefs.areas, a] })
  const selectAll = (t: Topic) => {
    const ids = areas[t].map((a) => a.id)
    const all = ids.every((id) => prefs.areas.includes(id))
    update({ areas: all ? prefs.areas.filter((x) => !ids.includes(x)) : [...new Set([...prefs.areas, ...ids])] })
  }

  return (
    <div className="fade-in mx-auto max-w-3xl px-6 pt-6 sm:px-8 sm:pt-10">
      <h1 className="t-display">Settings</h1>

      <div
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center transition-all sm:bottom-8 ${toast ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
      >
        <span className="t-meta inline-flex items-center gap-2 rounded-full bg-charcoal px-4 py-2.5 text-sand shadow-soft">
          <CheckIcon className="h-4 w-4" strokeWidth={2.5} /> Preferences saved
        </span>
      </div>

      <section className="mt-8 border-t border-rule pt-6">
        <h2 className="t-eyebrow text-sage-ink">Topics</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {allTopics.map((t) => {
            const on = prefs.topics.includes(t)
            return (
              <button
                key={t}
                onClick={() => toggleTopic(t)}
                aria-pressed={on}
                className={`press flex h-full flex-col rounded-card p-4 text-left ${on ? 'ring-2 ring-forest' : 'ring-1 ring-charcoal/15 hover:ring-charcoal/30'}`}
              >
                <span className="flex flex-1 items-start justify-between gap-2">
                  <span>
                    <span className="block font-serif text-[24px] font-semibold leading-7">{topicInfo[t].name}</span>
                    <span className="t-meta mt-1.5 block text-charcoal-400">{topicInfo[t].desc}</span>
                  </span>
                  <Check on={on} />
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {prefs.topics.map((t) => {
        const allOn = areas[t].every((a) => prefs.areas.includes(a.id))
        return (
          <section key={t} className="mt-7">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="t-eyebrow text-charcoal-500">{topicInfo[t].name} areas</h3>
              <button onClick={() => selectAll(t)} className="t-meta -my-3 py-3 text-forest hover:text-charcoal">
                {allOn ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-2">
              {areas[t].map((a) => {
                const on = prefs.areas.includes(a.id)
                return (
                  <button key={a.id} onClick={() => toggleArea(a.id)} aria-pressed={on} className="press flex h-11 items-center">
                    <span
                      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-[14px] font-medium ${on ? 'border-forest bg-forest text-sand' : 'border-charcoal/20 text-charcoal hover:border-charcoal/40'}`}
                    >
                      {on && <CheckIcon className="-ml-1 h-3.5 w-3.5" strokeWidth={2.75} />}
                      {a.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}

      <section className="mt-10 border-t border-rule pt-6">
        <h2 className="t-eyebrow text-sage-ink">How much to show</h2>
        <div className="mt-3" role="radiogroup">
          {(Object.keys(depthInfo) as Depth[]).map((d) => {
            const on = prefs.depth === d
            return (
              <button
                key={d}
                role="radio"
                aria-checked={on}
                onClick={() => update({ depth: d })}
                className="press flex w-full items-center gap-4 border-t border-rule py-4 text-left first:border-0"
              >
                <span className="flex-1">
                  <span className={`block font-medium ${on ? 'text-forest' : ''}`}>{depthInfo[d].name}</span>
                  <span className="t-meta mt-0.5 block text-charcoal-400">{depthInfo[d].desc}</span>
                </span>
                <Radio on={on} />
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-6 border-t border-rule pt-6">
        <h2 className="t-eyebrow text-sage-ink">Daily briefing</h2>
        <div className="mt-3">
          <div className="flex min-h-[56px] items-center gap-4 py-2">
            <label className="flex-1" htmlFor="brief-time">
              Preferred time
            </label>
            <select
              id="brief-time"
              value={prefs.briefTime ?? '08:00'}
              onChange={(e) => update({ briefTime: e.target.value })}
              className="tnum h-11 appearance-none rounded-card border border-charcoal/15 bg-transparent bg-[length:14px] bg-[right_12px_center] bg-no-repeat pl-4 pr-9 text-[15px] font-medium"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231F1F1F' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
            >
              {times.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex min-h-[56px] items-center gap-4 border-t border-rule py-2">
            <span className="flex-1">
              <span className="block">Briefing reminder</span>
              <span className="t-meta block text-charcoal-400">A nudge when your briefing is ready.</span>
            </span>
            <button
              role="switch"
              aria-checked={prefs.reminder}
              aria-label="Briefing reminder"
              onClick={() => update({ reminder: !prefs.reminder })}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${prefs.reminder ? 'bg-forest' : 'bg-charcoal/20'}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-sand transition-all ${prefs.reminder ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 border-t border-rule pt-6">
        <h2 className="t-eyebrow text-sage-ink">General</h2>
        <div className="mt-3">
          <div className="flex min-h-[52px] items-center gap-4">
            <span className="flex-1">Language</span>
            <span className="t-meta text-charcoal-400">English</span>
          </div>
          <div className="flex min-h-[52px] items-center gap-4 border-t border-rule">
            <span className="flex-1">Account</span>
            <span className="t-meta text-charcoal-400">{prefs.email ?? 'No account yet'}</span>
          </div>
          <button
            onClick={() => {
              reset()
              nav('/welcome')
            }}
            className="press flex min-h-[52px] w-full items-center gap-3 border-t border-rule text-left text-charcoal-500 hover:text-charcoal"
          >
            <span className="flex-1">Reset preferences</span>
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  )
}

function Radio({ on }: { on: boolean }) {
  return (
    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-[1.5px] ${on ? 'border-forest' : 'border-charcoal/25'}`}>
      {on && <span className="h-2.5 w-2.5 rounded-full bg-forest" />}
    </span>
  )
}
