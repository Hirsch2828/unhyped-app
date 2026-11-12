import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { applyFilter, buildHome, feedFor, homeChips, issueNo, type HomeRow } from '../lib/feed'
import { usePrefs, type Snap } from '../lib/prefs'
import { useStories } from '../lib/stories'
import type { Story } from '../data/types'
import { CategoryBadge, CompactRow, Headline, MetaRow, Plate, Row, SectionHeader, StoryCard, TrustMark, plural } from '../components/ui'

const ISSUE_SIZE = 5
const ROW_PREVIEW = 10

// Changed since you read it: more sources, a new label or a new headline.
export const changedSince = (s: Story, snap?: Snap) =>
  !!snap && (s.mergedCount > snap.sources || s.label !== snap.label || s.title !== snap.title)

export default function Home() {
  const { prefs } = usePrefs()
  const { articles24h } = useStories()
  const [params, setParams] = useSearchParams()
  const chips = homeChips(prefs.topics, prefs.depth)
  const filter = chips.some((c) => c.id === params.get('f')) ? params.get('f')! : 'all'
  const onlyChanged = params.get('since') === '1'
  const pick = (id: string) => setParams(id === 'all' ? {} : { f: id }, { replace: true })
  const q = filter === 'all' ? '' : `?f=${filter}`

  // Today's issue: the most important confirmed stories of the last day (two days if the day was quiet).
  const feed = applyFilter(feedFor(prefs.topics, prefs.depth), filter)
  const ranked = [...feed].filter((s) => s.label !== 'rumor').sort((a, b) => b.importance - a.importance || b.mergedCount - a.mergedCount || a.hoursAgo - b.hoursAgo)
  const day = ranked.filter((s) => s.hoursAgo <= 24)
  const issue = (day.length >= 3 ? day : ranked.filter((s) => s.hoursAgo <= 48)).slice(0, ISSUE_SIZE)
  const inIssue = new Set(issue.map((s) => s.id))

  // Since your last visit
  const prev = prefs.prevVisit
  const fresh = prev ? feed.filter((s) => Date.now() - s.hoursAgo * 3600_000 > prev && !prefs.read.includes(s.id)) : []
  const changed = feed.filter((s) => changedSince(s, prefs.snaps[s.id]))
  const sinceList = [...new Map([...changed, ...fresh].map((s) => [s.id, s])).values()]

  // The rest of the week, each story once.
  const { rows } = buildHome(prefs.topics, prefs.depth, prefs.areas, filter)
  const shown = new Set(inIssue)
  const take = (items: Story[], n: number) => {
    const out = items.filter((s) => !shown.has(s.id)).slice(0, n)
    out.forEach((s) => shown.add(s.id))
    return out
  }
  const alsoToday = take([...feed].filter((s) => s.hoursAgo <= 24 && s.label !== 'rumor').sort((a, b) => a.hoursAgo - b.hoursAgo), 6)
  const rest = rows
    .filter((r) => !['relevant', 'latest', 'trending-now', 'trending'].includes(r.id))
    .map((r): HomeRow & { preview: Story[] } => ({ ...r, preview: take(r.items, ROW_PREVIEW) }))
    .filter((r) => r.preview.length >= 2)

  const hype = issue.map((s) => s.hypeTitle).filter((t): t is string => !!t).slice(0, 3)

  return (
    <div className="fade-in pb-2">
      <div className="mx-auto max-w-3xl">
        <Cover articles={articles24h} count={issue.length} hype={hype} />

        <nav aria-label="Filter by desk" className="mt-6">
          <div className="no-scrollbar fade-right flex gap-2 overflow-x-auto px-6 pr-12 sm:px-8">
            {chips.map((c) => (
              <button key={c.id} onClick={() => pick(c.id)} aria-pressed={filter === c.id} className="press flex h-11 shrink-0 items-center">
                <span
                  className={`t-eyebrow flex h-8 items-center border px-3 ${
                    filter === c.id ? 'border-ink bg-ink text-paper' : 'border-rule text-ink-soft hover:border-ink hover:text-ink'
                  }`}
                >
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {sinceList.length > 0 && (
          <div className="mx-6 mt-4 sm:mx-8">
            <button
              onClick={() => setParams(onlyChanged ? (filter === 'all' ? {} : { f: filter }) : { ...(filter === 'all' ? {} : { f: filter }), since: '1' }, { replace: true })}
              aria-pressed={onlyChanged}
              className="press flex min-h-[44px] w-full items-center justify-between gap-3 border border-ink px-4 py-2.5 text-left"
            >
              <span className="t-meta text-ink">
                <span className="mark">Δ</span>{' '}
                {[fresh.length && `${fresh.length} new`, changed.length && `${changed.length} updated`].filter(Boolean).join(' · ')} since your last visit
              </span>
              <span className="t-eyebrow text-ink-soft">{onlyChanged ? 'Show all' : 'Show'}</span>
            </button>
          </div>
        )}

        {onlyChanged ? (
          <section className="mt-8">
            <SectionHeader title="Since your last visit" />
            <div className="border-b border-rule px-6 sm:px-8">
              {sinceList.map((s) => (
                <CompactRow key={s.id} story={s} lead={changedSince(s, prefs.snaps[s.id]) ? <span className="t-eyebrow mt-0.5 w-14 shrink-0 text-ink">Updated</span> : <span className="t-eyebrow mt-0.5 w-14 shrink-0 text-ink">New</span>} />
              ))}
            </div>
          </section>
        ) : (
          <>
            {/* The index */}
            <section className="mt-6" aria-label="Today's issue">
              <div className="px-6 sm:px-8">
                <div className="rule-strong flex items-baseline justify-between pt-2.5">
                  <h2 className="t-eyebrow text-ink">In this issue</h2>
                  <Link to="/brief" className="t-eyebrow -my-3 inline-flex min-h-[44px] items-center gap-1 text-ink-soft hover:text-ink">
                    Read as cards <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              {issue[0] && <Lead story={issue[0]} read={prefs.read.includes(issue[0].id)} />}
              <ol className="px-6 sm:px-8">
                {issue.slice(1).map((s, i) => (
                  <li key={s.id}>
                    <IndexRow story={s} n={i + 2} read={prefs.read.includes(s.id)} />
                  </li>
                ))}
              </ol>
              {!issue.length && <p className="t-body px-6 py-8 text-ink-soft sm:px-8">Nothing urgent on this desk today. Enjoy that.</p>}
            </section>

            {alsoToday.length > 0 && (
              <section className="mt-10">
                <SectionHeader title="Also today" />
                <div className="px-6 sm:px-8">
                  {alsoToday.map((s) => (
                    <CompactRow key={s.id} story={s} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {!onlyChanged && (
        <div className="mt-10 space-y-10">
          {rest.map((r) => (
            <Row key={r.id} title={r.title} subtitle={r.id === 'rumors' ? r.subtitle : undefined} seeAll={r.items.length > r.preview.length ? `/c/${r.id}${q}` : undefined}>
              {r.preview.map((s) => (
                <StoryCard key={s.id} story={s} />
              ))}
            </Row>
          ))}
        </div>
      )}

      <LastPage />
    </div>
  )
}

/* ---------- The cover: noise to signal ---------- */

const PLAYED = 'unhyped.cover.played'

function Cover({ articles, count, hype }: { articles: number | null; count: number; hype: string[] }) {
  // Plays once a day; after that the cover opens in its final state. "Replay" runs it again.
  const today = new Date().toDateString()
  const [run, setRun] = useState(() => {
    try {
      return localStorage.getItem(PLAYED) !== today
    } catch {
      return false
    }
  })
  const [key, setKey] = useState(0)
  useEffect(() => {
    if (!run) return
    try {
      localStorage.setItem(PLAYED, today)
    } catch {
      /* storage unavailable */
    }
  }, [run, today])
  const noise = articles ?? null

  return (
    <section className="px-6 pt-5 sm:px-8 sm:pt-8" aria-label={`Issue ${issueNo()}`}>
      <div key={key} className="relative">
        {hype.length > 0 && (
          <ul aria-label="Headlines elsewhere today" className="mb-4 space-y-1.5">
            {hype.map((h, i) => (
              <li
                key={h}
                className={`t-meta truncate text-ink-soft ${run ? 'noise-line' : 'opacity-70'}`}
                style={run ? { animationDelay: `${i * 120}ms` } : undefined}
              >
                <span className="t-eyebrow mr-1.5">Elsewhere:</span>
                <span className="line-through decoration-ink-soft">“{h}”</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-end gap-4">
          {noise !== null && (
            <div className="min-w-0">
              <span className={`block text-[64px] font-bold leading-[0.85] tracking-[-0.06em] text-ink-faint tnum ${run ? 'strike-draw' : 'line-through decoration-[3px]'}`}>
                {noise}
              </span>
              <span className="t-eyebrow mt-2 block text-ink-soft">articles read</span>
            </div>
          )}
          <span aria-hidden className="pb-6 text-[28px] font-bold leading-none text-ink">→</span>
          <div className={run ? 'signal-in' : ''}>
            <span className="block bg-lime px-2 text-[64px] font-bold leading-[0.95] tracking-[-0.06em] text-lime-ink tnum">{count}</span>
            <span className="t-eyebrow mt-2 block text-ink">{count === 1 ? 'story' : 'stories'} that matter</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="t-meta text-ink-soft">
          {noise !== null ? `We read ${noise} articles in the last 24 hours.` : 'Today’s issue.'} Here is what holds up.
        </p>
        <button
          onClick={() => {
            setRun(true)
            setKey((k) => k + 1)
          }}
          className="press t-eyebrow -my-2 inline-flex min-h-[44px] shrink-0 items-center gap-1.5 text-ink-soft hover:text-ink"
          aria-label="Replay noise to signal"
        >
          <RotateCcw className="h-3 w-3" /> Replay
        </button>
      </div>
    </section>
  )
}

/* ---------- The index ---------- */

function Lead({ story, read }: { story: Story; read: boolean }) {
  return (
    <Link to={`/story/${story.id}`} className={`press group mt-3 block px-6 sm:px-8 ${read ? 'opacity-55' : ''}`}>
      <Plate story={story} size="lg" className="aspect-[16/9] w-full" />
      <div className="mt-3 flex items-baseline gap-3">
        <span className="font-mono text-[13px] font-semibold text-ink">01</span>
        <CategoryBadge story={story} />
      </div>
      <h3 className="t-h1 mt-1.5 text-ink sm:text-[34px] sm:leading-[36px]">
        <Headline story={story} />
      </h3>
      <p className="t-body mt-2 text-ink-soft">{story.dek}</p>
      <div className="mt-3">
        <MetaRow story={story} />
      </div>
    </Link>
  )
}

function IndexRow({ story, n, read }: { story: Story; n: number; read: boolean }) {
  const rumor = story.label === 'rumor'
  return (
    <Link to={`/story/${story.id}`} className={`press group mt-5 flex gap-4 border-t border-rule pt-4 ${read ? 'opacity-55' : ''}`}>
      <span className="w-9 shrink-0 font-mono text-[26px] font-semibold leading-[26px] text-ink tnum">{String(n).padStart(2, '0')}</span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <CategoryBadge story={story} />
          <TrustMark label={story.label} />
        </span>
        <span className={`t-card mt-1.5 block text-[20px] leading-[23px] text-ink ${rumor ? 'font-medium' : ''}`}>
          <Headline story={story} />
        </span>
        <span className="t-meta mt-2 block text-ink-soft">
          {story.time} · {plural(story.sources.length || story.mergedCount, 'source')}
        </span>
      </span>
    </Link>
  )
}

/* ---------- The last page ---------- */

export function LastPage({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`mx-6 border-t-2 border-ink pt-6 sm:mx-8 ${compact ? '' : 'mt-14'}`}>
      <p className="t-eyebrow text-ink-soft">End of issue No. {issueNo()}</p>
      <p className="mt-3 text-[32px] font-bold leading-[33px] tracking-[-0.04em] text-ink">
        That’s the issue.
        <br />
        <span className="mark">Go do something good.</span>
      </p>
      <p className="t-meta mt-4 text-ink-soft">No. {issueNo() + 1} comes out tomorrow morning. New stories still arrive through the day.</p>
    </div>
  )
}
