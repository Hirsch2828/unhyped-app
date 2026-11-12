import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { briefItems, feedFor, issueNo } from '../lib/feed'
import { useStories } from '../lib/stories'
import { usePrefs } from '../lib/prefs'
import type { Story } from '../data/types'
import { CategoryBadge, CompactRow, Headline, Plate, TrustMark, plural } from '../components/ui'
import { LastPage } from './Home'
import { statusLine } from './StoryPage'

const VIEW = 'unhyped.brief.view'

export default function Brief() {
  const { prefs } = usePrefs()
  useStories()
  const items = briefItems(prefs.topics).slice(0, 5)
  const rumors = feedFor(prefs.topics, 'everything').filter((s) => s.label === 'rumor').slice(0, 4)
  const [view, setView] = useState<'cards' | 'list'>(() => {
    try {
      return localStorage.getItem(VIEW) === 'list' ? 'list' : 'cards'
    } catch {
      return 'cards'
    }
  })
  const choose = (v: 'cards' | 'list') => {
    setView(v)
    try {
      localStorage.setItem(VIEW, v)
    } catch {
      /* storage unavailable */
    }
  }
  const total = items.length + 1 // the last card is the end of the issue

  return (
    <div className="fade-in">
      {view === 'cards' ? (
        <Cards items={items} total={total} onList={() => choose('list')} />
      ) : (
        <div className="mx-auto max-w-3xl px-6 pt-4 sm:px-8 sm:pt-8">
          <div className="flex items-center justify-between border-b-2 border-ink pb-3">
            <Link to="/" className="press -ml-3 grid h-11 w-11 place-items-center" aria-label="Back to today’s issue">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <span className="t-meta text-ink-soft">Briefing · No. {issueNo()}</span>
            <button onClick={() => choose('cards')} className="press t-eyebrow min-h-[44px] text-ink-soft hover:text-ink">
              View as cards
            </button>
          </div>
          <h1 className="t-display mt-5">Today in five minutes</h1>
          <p className="t-meta mt-2 text-ink-soft">{plural(items.length, 'story', 'stories')} · ~5 min</p>
          <ol className="mt-6 border-b border-rule">
            {items.map((s, i) => (
              <li key={s.id}>
                <CompactRow story={s} lead={<span className="w-9 shrink-0 font-mono text-[26px] font-semibold leading-[26px] tnum onum">{String(i + 1).padStart(2, '0')}</span>} />
              </li>
            ))}
          </ol>
          {rumors.length > 0 && (
            <section className="mt-10 border border-dashed border-ink p-4">
              <h2 className="t-eyebrow text-ink">Also going around · not confirmed</h2>
              <ul className="mt-2">
                {rumors.map((s) => (
                  <li key={s.id}>
                    <Link to={`/story/${s.id}`} className="press group flex min-h-[44px] items-baseline gap-3 border-t border-rule py-3 first:border-0">
                      <TrustMark label="rumor" />
                      <span className="text-[16px] font-medium leading-[21px] group-hover:underline">{s.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className="mb-8 mt-4">
            <LastPage />
          </div>
        </div>
      )}
    </div>
  )
}

// Full-screen cards: swipe sideways, progress on top, the last card ends the issue.
function Cards({ items, total, onList }: { items: Story[]; total: number; onList: () => void }) {
  const track = useRef<HTMLDivElement>(null)
  const [at, setAt] = useState(0)
  useEffect(() => {
    const el = track.current
    if (!el) return
    const on = () => setAt(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
    el.addEventListener('scroll', on, { passive: true })
    return () => el.removeEventListener('scroll', on)
  }, [])
  const go = (i: number) => {
    const el = track.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' })
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(Math.min(total - 1, at + 1))
      if (e.key === 'ArrowLeft') go(Math.max(0, at - 1))
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [at, total])

  return (
    <div className="flex h-[calc(100dvh-64px-env(safe-area-inset-bottom))] flex-col sm:h-[calc(100dvh-64px)]">
      <div className="mx-auto w-full max-w-3xl px-4 pt-3 sm:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="press -ml-2 grid h-11 w-11 place-items-center" aria-label="Close briefing">
            <X className="h-5 w-5" />
          </Link>
          <span className="t-meta text-ink" aria-live="polite">
            {Math.min(at + 1, total)} of {total}
          </span>
          <button onClick={onList} className="press t-eyebrow min-h-[44px] px-1 text-ink-soft hover:text-ink">
            View as list
          </button>
        </div>
        <div className="mt-1 flex gap-1" aria-hidden>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-[5px] flex-1 ${i === at ? 'bg-lime ring-1 ring-ink' : i < at ? 'bg-ink' : 'bg-ink/15'}`} />
          ))}
        </div>
      </div>

      <div ref={track} className="no-scrollbar mt-3 flex flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden" aria-label="Briefing cards">
        {items.map((s, i) => (
          <section key={s.id} className="flex h-full w-full shrink-0 snap-start snap-always flex-col overflow-y-auto px-6 pb-4 sm:px-8" aria-label={`Story ${i + 1} of ${items.length}`}>
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
              <div className="flex items-baseline gap-3 border-t-2 border-ink pt-3">
                <span className="font-mono text-[34px] font-semibold leading-none tnum onum">{String(i + 1).padStart(2, '0')}</span>
                <CategoryBadge story={s} />
              </div>
              <h2 className="t-h1 mt-4 text-[30px] leading-[32px]">
                <Headline story={s} />
              </h2>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <TrustMark label={s.label} />
                <span className="t-meta text-ink-soft">{statusLine(s)}</span>
              </div>
              <div className="mt-5 border-l-[3px] border-ink pl-4">
                <p className="t-eyebrow">Why it matters</p>
                <p className="mt-1.5 text-[17px] font-medium leading-[25px]">{s.whyItMatters}</p>
              </div>
              <Plate story={s} size="md" className="mt-5 min-h-[90px] w-full flex-1" />
              <Link to={`/story/${s.id}`} className="press mt-4 flex min-h-[48px] items-center justify-between bg-ink px-4 text-paper">
                <span className="t-eyebrow">Read more</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        ))}
        <section className="flex h-full w-full shrink-0 snap-start snap-always flex-col justify-center pb-6" aria-label="End of the issue">
          <div className="mx-auto w-full max-w-3xl">
            <LastPage compact />
            <div className="mx-6 mt-6 sm:mx-8">
              <Link to="/" className="press flex min-h-[48px] items-center justify-between border-2 border-ink px-4">
                <span className="t-eyebrow">Back to the issue</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="mx-auto hidden w-full max-w-3xl justify-between px-8 pb-4 sm:flex">
        <button onClick={() => go(Math.max(0, at - 1))} disabled={at === 0} className="press t-eyebrow min-h-[44px] disabled:opacity-30">
          ← Previous
        </button>
        <button onClick={() => go(Math.min(total - 1, at + 1))} disabled={at >= total - 1} className="press t-eyebrow min-h-[44px] disabled:opacity-30">
          Next →
        </button>
      </div>
    </div>
  )
}
