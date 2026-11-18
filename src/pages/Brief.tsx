// The 60-second scan: know what happened today without reading a single article.
// One card per story: one line, the Reality score, one "so what" line and today's price move.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bookmark, X } from 'lucide-react'
import { briefItems } from '../lib/feed'
import { useStories } from '../lib/stories'
import { usePrefs } from '../lib/prefs'
import { SUPABASE_URL } from '../lib/supabase'
import type { Story } from '../data/types'
import { CategoryBadge, TrustMark, plural } from '../components/ui'
import { verdictOf } from '../components/StoryParts'

const SECONDS = 60

/** The first sentence of a paragraph: the "so what" line. */
const firstSentence = (t: string) => (t.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? t).trim()

export default function Brief() {
  const { prefs } = usePrefs()
  useStories()
  const items = briefItems(prefs.topics, prefs.own, prefs.depth)
  const [at, setAt] = useState(0)
  const [later, setLater] = useState<string[]>([])
  const started = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const done = at >= items.length
  const per = items.length ? SECONDS / items.length : 0
  const left = Math.max(0, Math.round((items.length - at) * per))

  const next = () => setAt((i) => Math.min(items.length, i + 1))
  const back = () => setAt((i) => Math.max(0, i - 1))
  const keep = (id: string) => {
    setLater((l) => (l.includes(id) ? l : [...l, id]))
    next()
  }

  useEffect(() => {
    if (done) setElapsed(Math.round((Date.now() - started.current) / 1000))
  }, [done])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input,textarea')) return
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })

  // Swipe sideways on touch screens.
  const touch = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => (touch.current = e.touches[0].clientX)
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touch.current === null) return
    const dx = e.changedTouches[0].clientX - touch.current
    touch.current = null
    if (dx < -50) next()
    if (dx > 50) back()
  }

  const restart = () => {
    started.current = Date.now()
    setLater([])
    setAt(0)
  }

  return (
    <div className="fade-in flex min-h-[calc(100dvh-64px-env(safe-area-inset-bottom))] flex-col px-4 sm:min-h-[calc(100dvh-72px)] sm:px-8">
      <h1 className="sr-only">The 60-second scan</h1>
      <div className="mx-auto w-full max-w-[880px] pt-3 sm:pt-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="press -ml-2 grid h-11 w-11 place-items-center" aria-label="Close the scan">
            <X className="h-5 w-5" />
          </Link>
          <p className="t-meta text-ink" aria-live="polite">
            {done ? 'Done' : `${at + 1} of ${items.length} · ~${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} left`}
          </p>
          <span className="w-11" aria-hidden />
        </div>
        <div className="mt-1 flex gap-1" aria-hidden>
          {items.map((s, i) => (
            <span key={s.id} className={`h-[5px] flex-1 ${i === at ? 'bg-lime ring-1 ring-ink' : i < at ? 'bg-ink' : 'bg-ink/15'}`} />
          ))}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[880px] flex-1 flex-col py-6 sm:py-10" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {!items.length ? (
          <p className="text-[18px] text-ink-soft">Nothing new to scan yet. Check back later today.</p>
        ) : done ? (
          <End items={items} later={later} seconds={elapsed} onRestart={restart} />
        ) : (
          <ScanCard key={items[at].id} story={items[at]} n={at + 1} total={items.length} saved={later.includes(items[at].id)} onLater={() => keep(items[at].id)} onSkip={next} onBack={at > 0 ? back : undefined} />
        )}
      </div>
    </div>
  )
}

function ScanCard({ story, n, total, saved, onLater, onSkip, onBack }: { story: Story; n: number; total: number; saved: boolean; onLater: () => void; onSkip: () => void; onBack?: () => void }) {
  const score = story.hypeScore
  const soWhat = firstSentence(story.whyItMatters)
  return (
    <section aria-label={`Story ${n} of ${total}`} className="fade-in flex flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2.5 border-t-2 border-ink pt-3">
        <TrustMark label={story.label} />
        <CategoryBadge story={story} />
        {story.ticker && <TodayMove ticker={story.ticker} />}
      </div>

      <h2 className="mt-5 text-balance text-[30px] font-bold leading-[33px] tracking-[-0.035em] text-ink sm:text-[46px] sm:leading-[49px]">
        <Link to={`/story/${story.id}`} className="hover:underline hover:decoration-[3px] hover:underline-offset-[6px]">
          {story.title}
        </Link>
      </h2>

      {score !== null && score !== undefined && (
        <div className="mt-6 flex items-center gap-4">
          <p className="shrink-0 text-ink">
            <span className="text-[34px] font-bold leading-none tracking-[-0.03em]">{score}</span>
            <span className="t-meta text-ink-soft">/100</span>
          </p>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-ink">Reality · {verdictOf(score)}</p>
            <div className="relative mt-1.5 h-2 border border-ink" aria-hidden>
              <div className="absolute inset-y-0 left-0 bg-ink" style={{ width: `${score}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-rule pt-4">
        <p className="text-[14px] font-bold text-ink">So what</p>
        <p className="mt-1 text-[19px] leading-[28px] text-ink sm:text-[22px] sm:leading-[32px]">{soWhat}</p>
      </div>

      <div className="flex-1" />

      <div className="mt-8 grid grid-cols-2 gap-3">
        <button onClick={onLater} aria-pressed={saved} className="press flex min-h-[52px] items-center justify-center gap-2 border-2 border-ink text-[16px] font-bold text-ink">
          <Bookmark className="h-4 w-4" /> Read later
        </button>
        <button onClick={onSkip} className="press flex min-h-[52px] items-center justify-center gap-2 bg-ink text-[16px] font-bold text-paper">
          Next <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 flex justify-between">
        {onBack ? (
          <button onClick={onBack} className="press t-meta min-h-[44px] text-ink-soft hover:text-ink">
            ← Previous
          </button>
        ) : (
          <span />
        )}
        <Link to={`/story/${story.id}`} className="t-meta inline-flex min-h-[44px] items-center text-ink-soft underline underline-offset-[3px] hover:text-ink">
          Open the full story
        </Link>
      </div>
    </section>
  )
}

function End({ items, later, seconds, onRestart }: { items: Story[]; later: string[]; seconds: number; onRestart: () => void }) {
  const kept = items.filter((s) => later.includes(s.id))
  return (
    <section aria-label="End of the scan" className="fade-in">
      <p className="text-[34px] font-bold leading-[37px] tracking-[-0.04em] text-ink sm:text-[46px] sm:leading-[49px]">That’s everything.</p>
      <p className="mt-2 text-[18px] text-ink-soft">
        {plural(items.length, 'story', 'stories')} in {seconds < 60 ? `${seconds} seconds` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`}.
      </p>
      {kept.length > 0 && (
        <div className="mt-8">
          <h2 className="t-section rule-strong pt-3">To read later</h2>
          <ul className="mt-2 border-b border-rule">
            {kept.map((s) => (
              <li key={s.id}>
                <Link to={`/story/${s.id}`} className="press group flex min-h-[52px] items-center justify-between gap-4 border-t border-rule py-3">
                  <span className="text-[17px] font-semibold leading-[23px] text-ink group-hover:underline">{s.title}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/" className="press flex min-h-[48px] items-center gap-2 bg-ink px-5 text-[15px] font-bold text-paper">
          Back to today’s stories <ArrowRight className="h-4 w-4" />
        </Link>
        <button onClick={onRestart} className="press min-h-[48px] border-2 border-ink px-5 text-[15px] font-bold text-ink">
          Scan again
        </button>
      </div>
    </section>
  )
}

/** Today's move for the story's stock, from the same delayed quote the story page uses. */
function TodayMove({ ticker }: { ticker: string }) {
  const [change, setChange] = useState<number | null>(null)
  useEffect(() => {
    let live = true
    fetch(`${SUPABASE_URL}/functions/v1/quote?t=${encodeURIComponent(ticker)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => live && d && typeof d.change === 'number' && setChange(d.change))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [ticker])
  if (change === null) return null
  const sign = change > 0 ? '+' : change < 0 ? '−' : ''
  return (
    <span className="t-tag border border-ink px-1.5 py-0.5 text-ink" title="Today, delayed about 15 minutes. Not advice.">
      {ticker} {sign}
      {Math.abs(change).toFixed(2)}% today
    </span>
  )
}
