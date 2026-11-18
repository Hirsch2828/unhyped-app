import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check as CheckIcon, RotateCcw } from 'lucide-react'
import type { Depth, Topic } from '../data/types'
import { SECTORS, allTopics, depthInfo, topicsOf, type SectorId } from '../data/topics'
import { usePrefs, type Theme } from '../lib/prefs'
import OwnTopics from '../components/OwnTopics'

const times = ['07:00', '08:00', '12:30', '18:00', '21:00']
const themes: { id: Theme; name: string; desc: string }[] = [
  { id: 'auto', name: 'Automatic', desc: 'Dark from 19:00 to 06:00' },
  { id: 'light', name: 'Light', desc: 'Paper, all day' },
  { id: 'dark', name: 'Dark', desc: 'Ink, all day' },
]

export default function Settings() {
  const { prefs, update, reset } = usePrefs()
  const nav = useNavigate()
  const [toast, setToast] = useState(false)
  // Show "Preferences saved" after a real change (saved automatically), not on first render.
  const key = JSON.stringify([prefs.topics, prefs.own, prefs.areas, prefs.depth, prefs.briefTime, prefs.reminder])
  const initial = useRef(key)
  useEffect(() => {
    if (key === initial.current) return
    initial.current = key
    setToast(true)
    const t = setTimeout(() => setToast(false), 2000)
    return () => clearTimeout(t)
  }, [key])

  const toggleTopic = (t: Topic) => {
    const next = prefs.topics.includes(t) ? prefs.topics.filter((x) => x !== t) : [...prefs.topics, t]
    if (next.length) update({ topics: next })
  }
  // Whole sector on or off; at least one topic always stays.
  const allOf = (id: SectorId) => {
    const ids = topicsOf(id).map((t) => t.id)
    const on = ids.every((t) => prefs.topics.includes(t))
    const next = on ? prefs.topics.filter((t) => !ids.includes(t)) : [...new Set([...prefs.topics, ...ids])]
    if (next.length) update({ topics: next })
  }

  return (
    <div className="fade-in px-6 pt-6 sm:px-8 sm:pt-10">
      <h1 className="t-display">Settings</h1>

      <div
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center transition-all sm:bottom-8 ${toast ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
      >
        <span className="text-[14px] leading-snug inline-flex items-center gap-2 rounded-full bg-charcoal px-4 py-2.5 text-sand shadow-soft">
          <CheckIcon className="h-4 w-4" strokeWidth={2.5} /> Preferences saved
        </span>
      </div>

      <div className="grid grid-cols-1 gap-x-16 lg:grid-cols-2">
      <div>
      <section className="mt-8 border-t border-rule pt-6">
        <h2 className="t-eyebrow text-ink-soft">Topics</h2>
        <p className="mt-1 text-[14px] text-ink-soft">{prefs.topics.length} of {allTopics.length} picked. Tap to add or remove.</p>
        <div className="mt-2">
          {SECTORS.map((sec) => {
            const list = topicsOf(sec.id)
            const all = list.every((t) => prefs.topics.includes(t.id))
            return (
              <section key={sec.id} className="border-t border-rule py-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-[16px] font-bold text-ink">{sec.name}</h3>
                  <button onClick={() => allOf(sec.id)} className="t-meta -my-3 min-h-[44px] px-1 text-ink-soft underline underline-offset-[3px] hover:text-ink">
                    {all ? 'Clear' : 'All'}
                  </button>
                </div>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {list.map((t) => {
                    const on = prefs.topics.includes(t.id)
                    return (
                      <li key={t.id}>
                        <button
                          onClick={() => toggleTopic(t.id)}
                          aria-pressed={on}
                          title={t.desc}
                          className={`press inline-flex min-h-[40px] items-center gap-1.5 border px-3 text-[14px] font-semibold ${on ? 'border-ink bg-ink text-paper' : 'border-ink/40 text-ink hover:border-ink'}`}
                        >
                          {on && <CheckIcon className="-ml-0.5 h-3.5 w-3.5" strokeWidth={2.75} />}
                          {t.name}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </div>
        <div className="mt-5 border-t border-rule pt-5">
          <h3 className="t-eyebrow text-ink-soft">Your own topics</h3>
          <p className="mt-1 text-[14px] text-ink-soft">1 to 3 words, like “Bitcoin” or “Apple Vision”. We match them across every source we read.</p>
          <div className="mt-3 max-w-md">
            <OwnTopics own={prefs.own} onChange={(own) => update({ own })} />
          </div>
        </div>
      </section>
      </div>

      <div>
      <section className="mt-10 border-t border-rule pt-6 lg:mt-8">
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
                  <span className="text-[14px] leading-snug mt-0.5 block text-charcoal-400">{depthInfo[d].desc}</span>
                </span>
                <Radio on={on} />
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-6 border-t border-rule pt-6">
        <h2 className="t-eyebrow text-sage-ink">Display</h2>
        <div role="radiogroup" aria-label="Display" className="mt-3 grid grid-cols-3 gap-2">
          {themes.map((t) => {
            const on = prefs.theme === t.id
            return (
              <button
                key={t.id}
                role="radio"
                aria-checked={on}
                onClick={() => update({ theme: t.id })}
                className={`press flex min-h-[64px] flex-col items-start justify-center border px-3 py-2 text-left ${on ? 'border-2 border-ink' : 'border-rule hover:border-ink'}`}
              >
                <span className="text-[15px] font-semibold">{t.name}</span>
                <span className="text-[14px] leading-snug mt-0.5 text-ink-soft">{t.desc}</span>
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
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23777A72' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
            >
              {times.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex min-h-[56px] items-center gap-4 border-t border-rule py-2">
            <span className="flex-1">
              <span className="block">Briefing reminder</span>
              <span className="text-[14px] leading-snug block text-charcoal-400">A nudge when your briefing is ready.</span>
            </span>
            <button
              role="switch"
              aria-checked={prefs.reminder}
              aria-label="Briefing reminder"
              onClick={() => update({ reminder: !prefs.reminder })}
              className={`relative h-7 w-12 shrink-0 transition before:absolute before:-inset-y-[9px] before:inset-x-0 before:content-[''] ${prefs.reminder ? 'bg-forest' : 'bg-charcoal/20'}`}
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
            <span className="text-[14px] leading-snug text-charcoal-400">English</span>
          </div>
          <div className="flex min-h-[52px] items-center gap-4 border-t border-rule">
            <span className="flex-1">Account</span>
            <span className="text-[14px] leading-snug text-charcoal-400">{prefs.email ?? 'No account yet'}</span>
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
      </div>
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
