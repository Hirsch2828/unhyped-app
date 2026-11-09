import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Depth, Topic } from '../data/types'
import { allTopics, depthInfo, topicInfo } from '../data/topics'
import { usePrefs } from '../lib/prefs'
import { Button, Check, Icon, Img, Logo } from '../components/ui'

export default function Onboarding() {
  const { update } = usePrefs()
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [topics, setTopics] = useState<Topic[]>(['ai'])
  const [depth, setDepth] = useState<Depth>('balanced')

  const toggleTopic = (t: Topic) => setTopics((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))

  const finish = (skip = false) => {
    update({
      onboarded: true,
      topics: topics.length ? topics : ['ai'],
      areas: [],
      depth: skip ? 'balanced' : depth,
    })
    nav('/', { replace: true })
  }

  const next = () => {
    if (step < 2) setStep(step + 1)
    else finish()
  }

  return (
    <div className="min-h-screen bg-sand sm:grid sm:place-items-center sm:py-10">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-sand-50 px-5 pb-6 pt-6 sm:min-h-0 sm:rounded-3xl sm:border sm:border-sand-300/70 sm:px-8 sm:shadow-card">
        <div className="flex items-center justify-between">
          <Logo />
          <button onClick={() => finish(true)} className="text-sm text-charcoal-500 hover:text-charcoal">
            Skip
          </button>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-200">
            <div className="h-full rounded-full bg-forest transition-all duration-500" style={{ width: `${(step / 2) * 100}%` }} />
          </div>
          <span className="text-sm text-charcoal-500">{step} / 2</span>
        </div>

        <div key={step} className="fade-in mt-8 flex-1">
          {step === 1 && (
            <>
              <h1 className="font-serif text-[2rem] font-semibold leading-tight">What are you interested in?</h1>
              <p className="mt-2 text-charcoal-500">Choose one or more topics to follow.</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {allTopics.map((t, i) => {
                  const on = topics.includes(t)
                  const big = i < 2 // launch topics get the big cards
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTopic(t)}
                      aria-pressed={on}
                      className={`relative overflow-hidden rounded-2xl border text-left transition ${on ? 'border-forest ring-2 ring-forest' : 'border-sand-300/70 hover:border-sage'}`}
                    >
                      {big ? (
                        <>
                          <Img src={topicInfo[t].image} className="h-44 w-full sm:h-48" />
                          <span className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/20 to-transparent" />
                          <span className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                            <span className="block text-xl font-semibold">{topicInfo[t].name}</span>
                            <span className="block text-[13px] leading-snug text-white/85">{topicInfo[t].desc}</span>
                          </span>
                        </>
                      ) : (
                        <>
                          <Img src={topicInfo[t].image} className="h-24 w-full" />
                          <span className="block bg-sand-50 p-3">
                            <span className="block font-semibold">{topicInfo[t].name}</span>
                            <span className="block text-[13px] leading-snug text-charcoal-500">{topicInfo[t].desc}</span>
                          </span>
                        </>
                      )}
                      <span className="absolute right-3 top-3">
                        <Check on={on} dark />
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-serif text-[2rem] font-semibold leading-tight">How much do you want to know?</h1>
              <p className="mt-2 text-charcoal-500">Choose the level of coverage that fits you. You can change this anytime.</p>
              <div className="mt-6 space-y-3">
                {(Object.keys(depthInfo) as Depth[]).map((d) => {
                  const on = depth === d
                  return (
                    <button
                      key={d}
                      onClick={() => setDepth(d)}
                      aria-pressed={on}
                      className={`flex w-full items-center gap-5 rounded-2xl border p-5 text-left transition ${on ? 'border-sage bg-sage-100/70' : 'border-sand-300/70 bg-sand-50 hover:border-sage'}`}
                    >
                      <Icon name={depthInfo[d].icon} className="h-9 w-9 shrink-0 text-charcoal" strokeWidth={1.5} />
                      <span className="flex-1">
                        <span className="block font-semibold">{depthInfo[d].name}</span>
                        <span className="block text-sm text-charcoal-500">{depthInfo[d].desc}</span>
                      </span>
                      <Check on={on} />
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
          <Button className="flex-1" disabled={step === 1 && topics.length === 0} onClick={next}>
            {step === 2 ? 'Create my feed' : 'Continue'} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-charcoal-400">
          {step === 2 ? 'No account needed. Start reading right away.' : 'You can always change this later in Settings.'}
        </p>
      </div>
    </div>
  )
}
