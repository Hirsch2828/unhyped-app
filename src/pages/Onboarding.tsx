// Onboarding (5י): a short interview in three steps.
// 1. Which areas (the 11 S&P sectors)  2. What exactly inside them  3. How much time a day.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Depth, Topic } from '../data/types'
import { SECTORS, depthInfo, topicInfo, topicsOf, type SectorId } from '../data/topics'
import { usePrefs } from '../lib/prefs'
import { getStories, useStories } from '../lib/stories'
import { feedFor } from '../lib/feed'
import { onePerThread } from '../lib/threads'
import { Button, Check, Logo } from '../components/ui'
import OwnTopics from '../components/OwnTopics'

const STEPS = 3
// Picked when you skip: the topics Unhyped started with.
const STARTER: Topic[] = ['ai', 'tesla', 'nvidia']

export default function Onboarding() {
  const { update } = usePrefs()
  const { mode } = useStories()
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [sectors, setSectors] = useState<SectorId[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [own, setOwn] = useState<string[]>([])
  const [depth, setDepth] = useState<Depth>('balanced')

  const toggleSector = (id: SectorId) => {
    if (sectors.includes(id)) {
      setSectors(sectors.filter((x) => x !== id))
      // Leaving a sector drops its topics too.
      setTopics(topics.filter((t) => topicInfo[t]?.sector !== id))
    } else {
      setSectors([...sectors, id])
    }
  }
  const toggleTopic = (t: Topic) => setTopics((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))
  const allOf = (id: SectorId) => {
    const ids = topicsOf(id).map((t) => t.id)
    const on = ids.every((t) => topics.includes(t))
    setTopics(on ? topics.filter((t) => !ids.includes(t)) : [...new Set([...topics, ...ids])])
  }

  // A sector you picked but left empty counts as "all of it".
  const chosen = (): Topic[] => {
    const out = new Set(topics)
    for (const s of sectors) if (!topicsOf(s).some((t) => out.has(t.id))) topicsOf(s).forEach((t) => out.add(t.id))
    return [...out]
  }
  const storiesFor = (d: Depth) => onePerThread(feedFor(chosen(), d, own).filter((x) => x.hoursAgo <= 24), getStories()).length

  const finish = (skip = false) => {
    const picked = skip ? STARTER : chosen()
    update({ onboarded: true, topics: picked.length ? picked : STARTER, own: skip ? [] : own, areas: [], depth: skip ? 'balanced' : depth })
    nav('/', { replace: true })
  }

  const canGo = step === 1 ? sectors.length > 0 || own.length > 0 : true
  const summary = chosen().map((t) => topicInfo[t]?.name).filter(Boolean)

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-5 pb-6 pt-4 sm:px-8">
        <div className="flex h-11 items-center justify-between">
          <Logo />
          <button onClick={() => finish(true)} className="t-meta -mr-2 h-11 px-2 text-ink-soft hover:text-ink">
            Skip
          </button>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex flex-1 gap-1" aria-hidden>
            {Array.from({ length: STEPS }, (_, i) => (
              <span key={i} className={`h-[5px] flex-1 ${i + 1 === step ? 'bg-lime ring-1 ring-ink' : i + 1 < step ? 'bg-ink' : 'bg-ink/15'}`} />
            ))}
          </div>
          <span className="t-meta text-ink-soft">
            {step} of {STEPS}
          </span>
        </div>

        <div key={step} className="fade-in mt-8 flex-1">
          {step === 1 && (
            <>
              <h1 className="t-display">What do you follow?</h1>
              <p className="mt-2 text-[17px] text-ink-soft">Pick the areas you care about. Next you get specific.</p>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {SECTORS.map((s) => {
                  const on = sectors.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSector(s.id)}
                      aria-pressed={on}
                      className={`press relative flex min-h-[148px] flex-col justify-end overflow-hidden border p-4 text-left ${on ? 'border-2 border-ink bg-ink text-paper' : 'border-ink text-ink'}`}
                    >
                      <span aria-hidden className="absolute right-3 top-9 text-[54px] font-bold leading-none tracking-[-0.06em] opacity-90">
                        {s.glyph}
                      </span>
                      <span className="absolute right-3 top-3">
                        <Check on={on} dark />
                      </span>
                      <span className="block pr-10 text-[20px] font-bold leading-[23px] tracking-[-0.02em]">{s.name}</span>
                      <span className={`t-meta mt-1.5 block ${on ? 'text-paper/80' : 'text-ink-soft'}`}>{s.desc}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="t-display">Get specific.</h1>
              <p className="mt-2 text-[17px] text-ink-soft">Pick exactly what you want inside each area. Leave an area empty and you get all of it.</p>
              <div className="mt-6 grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-2">
                {sectors.map((id) => {
                  const sector = SECTORS.find((x) => x.id === id)!
                  const list = topicsOf(id)
                  const all = list.every((t) => topics.includes(t.id))
                  return (
                    <section key={id} className="border-t-2 border-ink pt-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <h2 className="text-[19px] font-bold tracking-[-0.02em]">{sector.name}</h2>
                        <button onClick={() => allOf(id)} aria-pressed={all} className="press t-meta min-h-[44px] px-1 text-ink-soft underline underline-offset-[3px] hover:text-ink">
                          {all ? 'Clear' : `All of ${sector.name}`}
                        </button>
                      </div>
                      <ul className="mt-1 flex flex-wrap gap-2">
                        {list.map((t) => {
                          const on = topics.includes(t.id)
                          return (
                            <li key={t.id}>
                              <button
                                onClick={() => toggleTopic(t.id)}
                                aria-pressed={on}
                                title={t.desc}
                                className={`press min-h-[44px] border px-3 text-[15px] font-semibold ${on ? 'border-ink bg-ink text-paper' : 'border-ink text-ink hover:bg-ink/5'}`}
                              >
                                {t.name}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  )
                })}
                <section className="border-t-2 border-ink pt-3 lg:col-span-2">
                  <h2 className="text-[19px] font-bold tracking-[-0.02em]">Add your own</h2>
                  <p className="t-meta mt-1 text-ink-soft">1 to 3 words, like “Bitcoin” or “Apple Vision”. We match them across every source we read.</p>
                  <div className="mt-3 max-w-[560px]">
                    <OwnTopics own={own} onChange={setOwn} />
                  </div>
                </section>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="t-display">How much time a day?</h1>
              <p className="mt-2 text-[17px] text-ink-soft">We keep your issue short. You can change this anytime.</p>
              <div className="mt-6 max-w-[720px] border-b border-rule" role="radiogroup" aria-label="Time a day">
                {(Object.keys(depthInfo) as Depth[]).map((d) => {
                  const on = depth === d
                  return (
                    <button key={d} role="radio" aria-checked={on} onClick={() => setDepth(d)} className="press flex w-full items-center gap-4 border-t border-rule py-5 text-left">
                      <span className="flex-1">
                        <span className="block text-[22px] font-bold leading-7 tracking-[-0.02em]">{depthInfo[d].name}</span>
                        <span className="mt-1 block text-[15px] leading-[21px] text-ink-soft">{depthInfo[d].desc}</span>
                      </span>
                      {mode === 'live' && <span className="t-meta shrink-0 text-ink-soft">{storiesFor(d)} today</span>}
                      <Check on={on} />
                    </button>
                  )
                })}
              </div>
              <div className="mt-8 max-w-[720px] border-2 border-ink p-4">
                <p className="t-eyebrow text-ink">Your issue</p>
                <p className="mt-1.5 text-[18px] leading-[27px] text-ink">{[...summary, ...own].join(', ') || 'AI & LLMs, Tesla, Nvidia'}</p>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 flex max-w-[720px] gap-3">
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Button className="flex-1" disabled={!canGo} onClick={() => (step < STEPS ? setStep(step + 1) : finish())}>
            {step === STEPS ? 'Start reading' : 'Continue'} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="t-meta mt-3 text-ink-soft">No account needed.</p>
      </div>
    </main>
  )
}
