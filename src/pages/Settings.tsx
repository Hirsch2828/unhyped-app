import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCircle2, Clock, Globe, Mail, RotateCcw } from 'lucide-react'
import type { Depth, Topic } from '../data/types'
import { allTopics, areas, depthInfo, topicInfo } from '../data/topics'
import { usePrefs } from '../lib/prefs'
import { Check, Icon, Img } from '../components/ui'

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
    <div className="fade-in mx-auto max-w-4xl px-4 pt-8 sm:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold sm:text-5xl">My Preferences</h1>
          <p className="mt-2 text-charcoal-500">Personalize your news and update your settings anytime.</p>
        </div>
        <div
          aria-live="polite"
          className={`flex items-center gap-3 rounded-xl bg-sage-100 px-4 py-2.5 transition-opacity ${toast ? 'opacity-100' : 'opacity-0'}`}
        >
          <CheckCircle2 className="h-5 w-5 text-forest" />
          <span>
            <span className="block text-sm font-medium">Preferences updated</span>
            <span className="block text-xs text-charcoal-500">Changes are saved automatically.</span>
          </span>
        </div>
      </div>

      <section className="mt-8 border-t border-sand-300/70 pt-6">
        <h2 className="font-serif text-2xl font-semibold">My interests</h2>
        <p className="text-sm text-charcoal-500">Choose the topics you want to follow.</p>
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {allTopics.map((t) => {
            const on = prefs.topics.includes(t)
            return (
              <button
                key={t}
                onClick={() => toggleTopic(t)}
                aria-pressed={on}
                className={`overflow-hidden rounded-xl border bg-sand-50 text-left transition ${on ? 'border-forest' : 'border-sand-300/70 hover:border-sage'}`}
              >
                <Img src={topicInfo[t].image} className="h-20 w-full" />
                <span className="flex items-center justify-between gap-1 p-2 text-sm font-medium">
                  <span className="truncate">{topicInfo[t].name}</span>
                  <Check on={on} />
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {prefs.topics.map((t) => (
        <section key={t} className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-semibold">{topicInfo[t].name} subtopics</h3>
              <p className="text-sm text-charcoal-500">Select the areas you’re most interested in.</p>
            </div>
            <button onClick={() => selectAll(t)} className="text-sm text-charcoal-500 hover:text-charcoal">
              Select all
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {areas[t].map((a) => {
              const on = prefs.areas.includes(a.id)
              return (
                <button
                  key={a.id}
                  onClick={() => toggleArea(a.id)}
                  aria-pressed={on}
                  className={`inline-flex items-center gap-2 rounded-full border py-1.5 pl-4 pr-1.5 text-sm transition ${on ? 'border-forest bg-forest text-sand-50' : 'border-sand-300 bg-sand-50 hover:border-sage'}`}
                >
                  {a.name}
                  <Check on={on} />
                </button>
              )
            })}
          </div>
        </section>
      ))}

      <section className="mt-8 border-t border-sand-300/70 pt-6">
        <h2 className="font-serif text-2xl font-semibold">My feed</h2>
        <p className="text-sm text-charcoal-500">Choose how many stories you see in your feed and briefing.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(Object.keys(depthInfo) as Depth[]).map((d) => {
            const on = prefs.depth === d
            return (
              <button
                key={d}
                onClick={() => update({ depth: d })}
                aria-pressed={on}
                className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition ${on ? 'border-sage bg-sage-100/70' : 'border-sand-300/70 bg-sand-50 hover:border-sage'}`}
              >
                <Icon name={depthInfo[d].icon} className="h-7 w-7 shrink-0" strokeWidth={1.5} />
                <span className="flex-1">
                  <span className="block font-semibold">{depthInfo[d].name}</span>
                  <span className="block text-sm text-charcoal-500">{depthInfo[d].desc}</span>
                </span>
                <Check on={on} />
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-8 border-t border-sand-300/70 pt-6">
        <h2 className="font-serif text-2xl font-semibold">Daily briefing</h2>
        <p className="text-sm text-charcoal-500">A short summary of what matters, at a time that suits you.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-sand-300/70 bg-sand-50 p-4">
            <Clock className="h-5 w-5 text-charcoal-500" />
            <label className="flex-1 text-sm" htmlFor="brief-time">
              Preferred time
            </label>
            <select
              id="brief-time"
              value={prefs.briefTime ?? '08:00'}
              onChange={(e) => update({ briefTime: e.target.value })}
              className="rounded-lg border border-sand-300 bg-sand px-3 py-2 text-sm"
            >
              {times.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-sand-300/70 bg-sand-50 p-4">
            <Bell className="h-5 w-5 text-charcoal-500" />
            <span className="flex-1">
              <span className="block text-sm">In-app briefing reminder</span>
              <span className="block text-xs text-charcoal-400">Get notified when your briefing is ready.</span>
            </span>
            <button
              role="switch"
              aria-checked={prefs.reminder}
              onClick={() => update({ reminder: !prefs.reminder })}
              className={`relative h-7 w-12 rounded-full transition ${prefs.reminder ? 'bg-forest' : 'bg-sand-300'}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${prefs.reminder ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8 border-t border-sand-300/70 pt-6">
        <h2 className="font-serif text-2xl font-semibold">General settings</h2>
        <div className="mt-4 divide-y divide-sand-300/70 overflow-hidden rounded-2xl border border-sand-300/70 bg-sand-50">
          <div className="flex items-center gap-4 p-4">
            <Globe className="h-5 w-5 text-charcoal-500" />
            <span className="flex-1 text-sm">Language</span>
            <span className="text-sm text-charcoal-400">English</span>
          </div>
          <div className="flex items-center gap-4 p-4">
            <Mail className="h-5 w-5 text-charcoal-500" />
            <span className="flex-1 text-sm">Account</span>
            <span className="text-sm text-charcoal-400">{prefs.email ?? 'No account yet'}</span>
          </div>
          <button
            onClick={() => {
              reset()
              nav('/welcome')
            }}
            className="flex w-full items-center gap-4 p-4 text-left hover:bg-sand-200/60"
          >
            <RotateCcw className="h-5 w-5 text-charcoal-500" />
            <span className="flex-1 text-sm">Start over (demo)</span>
          </button>
        </div>
      </section>
    </div>
  )
}
