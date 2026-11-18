import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Depth, Topic } from '../data/types'
import { allTopics, depthInfo, topicInfo } from '../data/topics'
import { usePrefs } from '../lib/prefs'
import { getStories, useStories } from '../lib/stories'
import { feedFor } from '../lib/feed'
import { onePerThread } from '../lib/threads'
import { Button, Check, Icon, Logo, TrustMark, labelHint } from '../components/ui'
import OwnTopics from '../components/OwnTopics'

export default function Onboarding() {
  const { update } = usePrefs()
  const { articles24h, mode } = useStories()
  // How many stories each depth would put in today's issue, for the topics picked so far.
  const storiesFor = (d: Depth) => onePerThread(feedFor(topics.length ? topics : ['ai'], d, own).filter((x) => x.hoursAgo <= 24), getStories()).length
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [topics, setTopics] = useState<Topic[]>(['ai'])
  const [own, setOwn] = useState<string[]>([])
  const [depth, setDepth] = useState<Depth>('balanced')

  const toggleTopic = (t: Topic) => setTopics((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))

  const finish = (skip = false) => {
    update({
      onboarded: true,
      topics: topics.length ? topics : ['ai'],
      own,
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
    <main className="min-h-screen bg-sand sm:grid sm:place-items-center sm:py-10">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-6 pb-6 pt-4 sm:min-h-0 sm:rounded-media sm:bg-sand-50 sm:px-10 sm:py-8 sm:shadow-soft">
        <div className="flex h-11 items-center justify-between">
          <Logo />
          <button onClick={() => finish(true)} className="t-meta -mr-2 h-11 px-2 text-charcoal-500 hover:text-charcoal">
            Skip
          </button>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="h-[2px] flex-1 bg-rule">
            <div className="h-full bg-forest transition-all duration-500" style={{ width: `${(step / 2) * 100}%` }} />
          </div>
          <span className="t-meta text-charcoal-400">{step} of 2</span>
        </div>

        <div key={step} className="fade-in mt-8 flex-1">
          {step === 1 && (
            <>
              <h1 className="t-display">What do you want to follow?</h1>
              <p className="mt-2 text-charcoal-500">Pick as many as you like, or add your own. You can change this later.</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {allTopics.map((t) => {
                  const on = topics.includes(t)
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTopic(t)}
                      aria-pressed={on}
                      className={`press relative aspect-[3/4] overflow-hidden border text-left ${on ? 'border-2 border-ink bg-ink text-paper' : 'border-ink text-ink'}`}
                    >
                      <span className={`halftone absolute inset-0 opacity-[0.14] [mask-image:linear-gradient(160deg,transparent_30%,#000_100%)] ${on ? 'invert' : ''}`} />
                      <span aria-hidden className={`absolute right-3 font-bold leading-none tracking-[-0.06em] ${t === 'nvidia' ? 'top-12 text-[60px]' : 'top-12 text-[96px]'}`}>{t === 'ai' ? '◇' : t === 'tesla' ? 'T' : '▦'}</span>
                      <span className="absolute inset-x-0 bottom-0 p-4">
                        <span className="block text-[26px] font-bold leading-7 tracking-[-0.03em]">{topicInfo[t].name}</span>
                        <span className={`t-meta mt-1.5 block min-h-[48px] ${on ? 'text-paper/80' : 'text-ink-soft'}`}>{topicInfo[t].desc}</span>
                      </span>
                      <span className="absolute right-3 top-3">
                        <Check on={on} dark />
                      </span>
                    </button>
                  )
                })}
                <div className={`relative col-span-2 border p-4 ${own.length ? 'border-2 border-ink' : 'border-ink'}`}>
                  <span className="block text-[26px] font-bold leading-7 tracking-[-0.03em]">Your own</span>
                  <span className="t-meta mt-1.5 block text-ink-soft">1 to 3 words. We build it from every source we read.</span>
                  <div className="mt-3">
                    <OwnTopics own={own} onChange={setOwn} />
                  </div>
                </div>
              </div>
              <div className="mt-8 border-t border-rule pt-5">
                <p className="t-eyebrow text-sage-ink">Every story is labeled</p>
                <ul className="mt-3 space-y-2.5 text-[14px] leading-5">
                  {(['official', 'report', 'rumor'] as const).map((l) => (
                    <li key={l} className="flex gap-3">
                      <span className="t-meta w-20 shrink-0 pt-0.5 text-charcoal">
                        <TrustMark label={l} />
                      </span>
                      <span className="text-charcoal-500">{labelHint(l)}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/how" className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-[15px] font-semibold text-ink underline decoration-1 underline-offset-[3px] hover:decoration-2">
                  {articles24h !== null ? `How ${articles24h} articles became today’s handful of stories` : 'How we choose what you see'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="t-display">How much do you want to know?</h1>
              <p className="mt-2 text-charcoal-500">Choose how much shows up each day. You can change this anytime.</p>
              <div className="mt-6 border-b border-rule" role="radiogroup">
                {(Object.keys(depthInfo) as Depth[]).map((d) => {
                  const on = depth === d
                  return (
                    <button
                      key={d}
                      role="radio"
                      aria-checked={on}
                      onClick={() => setDepth(d)}
                      className="press flex w-full items-center gap-4 border-t border-rule py-5 text-left"
                    >
                      <Icon name={depthInfo[d].icon} className={`h-6 w-6 shrink-0 ${on ? 'text-forest' : 'text-charcoal-400'}`} strokeWidth={1.5} />
                      <span className="flex-1">
                        <span className="block text-[19px] font-semibold leading-6 tracking-[-0.01em]">{depthInfo[d].name}</span>
                        <span className="mt-1 block text-[14px] leading-[20px] text-ink-soft">{depthInfo[d].desc}</span>
                      </span>
                      {mode === 'live' && <span className="t-meta shrink-0 text-ink-soft">{storiesFor(d)} today</span>}
                      <Check on={on} />
                    </button>
                  )
                })}
              </div>
              {/* The promise, made concrete before you commit: what today's issue will hold. */}
              {mode === 'live' && (
                <p className="mt-5 text-[17px] leading-[25px] text-ink" aria-live="polite">
                  Today that’s <span className="mark font-semibold">{storiesFor(depth)} {storiesFor(depth) === 1 ? 'story' : 'stories'}</span>
                  {articles24h !== null ? `, picked from ${articles24h} articles.` : '.'}
                </p>
              )}
            </>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)} aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Button className="flex-1" disabled={step === 1 && topics.length === 0 && own.length === 0} onClick={next}>
            {step === 2 ? 'Create my feed' : 'Continue'} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="t-meta mt-3 text-center text-charcoal-400">
          {step === 2 ? 'No account needed. Start reading right away.' : 'No account needed.'}
        </p>
      </div>
    </main>
  )
}
