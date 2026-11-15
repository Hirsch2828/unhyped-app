import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { applyFilter, feedFor, homeChips, issueNo, todayIssue } from '../lib/feed'
import { usePrefs, type Snap } from '../lib/prefs'
import { useStories } from '../lib/stories'
import type { Story } from '../data/types'
import { CategoryBadge, CompactRow, Headline, MetaRow, Photo, StoryCard, TrustMark } from '../components/ui'

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

  const feed = applyFilter(feedFor(prefs.topics, prefs.depth), filter)
  const { issue, quiet } = todayIssue(feed)
  const [lead, ...also] = issue
  const shown = new Set(issue.map((s) => s.id))

  // Since your last visit
  const prev = prefs.prevVisit
  const fresh = prev ? feed.filter((s) => Date.now() - s.hoursAgo * 3600_000 > prev && !prefs.read.includes(s.id)) : []
  const changed = feed.filter((s) => changedSince(s, prefs.snaps[s.id]))
  const sinceList = [...new Map([...changed, ...fresh].map((s) => [s.id, s])).values()]

  // Everything else: today first, then the rest of the week by importance. Each story once.
  const rest = feed
    .filter((s) => !shown.has(s.id))
    .sort((a, b) => Number(b.hoursAgo <= 24) - Number(a.hoursAgo <= 24) || b.importance - a.importance || a.hoursAgo - b.hoursAgo)
  const official = rest.filter((s) => s.label === 'official').slice(0, 4)
  const officialIds = new Set(official.map((s) => s.id))
  const list = rest.filter((s) => !officialIds.has(s.id)).slice(0, 10)

  const intro = quiet
    ? 'Quiet day. Nothing new held up in the last 48 hours, so here are the latest stories.'
    : articles24h !== null
      ? `We read ${articles24h} articles in the last 24 hours. ${issue.length === 1 ? 'This one is' : `These ${issue.length} are`} worth your time.`
      : `${issue.length} stories worth your time today.`

  return (
    <div className="fade-in px-4 pb-2 sm:px-8">
      <div className="flex flex-col gap-3 pt-5 sm:pt-7 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-[16px] leading-6 text-ink-soft sm:text-[18px]">{intro}</p>
        <nav aria-label="Filter by desk" className="-mx-1 flex flex-wrap">
          {chips.slice(0, 6).map((c) => (
            <button key={c.id} onClick={() => pick(c.id)} aria-pressed={filter === c.id} className="press flex h-11 items-center px-1">
              <span className={`flex h-8 items-center px-2.5 text-[14px] font-semibold ${filter === c.id ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>{c.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {sinceList.length > 0 && (
        <button
          onClick={() => setParams(onlyChanged ? (filter === 'all' ? {} : { f: filter }) : { ...(filter === 'all' ? {} : { f: filter }), since: '1' }, { replace: true })}
          aria-pressed={onlyChanged}
          className="press mt-3 flex min-h-[44px] w-full items-center justify-between gap-3 border-[1.5px] border-ink px-4 py-2 text-left"
        >
          <span className="text-[15px] font-medium text-ink">
            <span className="mark font-bold">Δ</span>{' '}
            {[fresh.length && `${fresh.length} new`, changed.length && `${changed.length} updated`].filter(Boolean).join(' · ')} since your last visit
          </span>
          <span className="t-eyebrow text-ink-soft">{onlyChanged ? 'Show all' : 'Show'}</span>
        </button>
      )}

      {onlyChanged ? (
        <section className="mt-8 lg:max-w-[66%]">
          <h2 className="t-section rule-strong pt-3">Since your last visit</h2>
          <div className="mt-2 border-b border-rule">
            {sinceList.map((s) => (
              <CompactRow key={s.id} story={s} thumb />
            ))}
          </div>
        </section>
      ) : (
        <>
          {lead ? <Lead story={lead} read={prefs.read.includes(lead.id)} /> : <p className="mt-10 text-[18px] text-ink-soft">No stories on this desk this week.</p>}

          {also.length > 0 && (
            <section className="mt-12 sm:mt-14" aria-label="Also in today's issue">
              <div className="rule-strong flex items-baseline justify-between pt-3">
                <h2 className="t-section">{quiet ? 'Also recent' : 'Also in today’s issue'}</h2>
                <Link to="/brief" className="t-eyebrow -my-3 inline-flex min-h-[44px] items-center gap-1 text-ink-soft hover:text-ink">
                  Read as cards <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="mt-1 grid grid-cols-1 gap-x-8 sm:mt-5 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4">
                {also.map((s) => (
                  <StoryCard key={s.id} story={s} rowOnPhone />
                ))}
              </div>
            </section>
          )}

          <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 sm:mt-14 lg:grid-cols-12">
            {list.length > 0 && (
              <section className="lg:col-span-8">
                <h2 className="t-section rule-strong pt-3">Everything else worth knowing</h2>
                <p className="mt-1 text-[15px] text-ink-soft">Smaller stories from this week, today’s first.</p>
                <div className="mt-2 border-b border-rule">
                  {list.map((s) => (
                    <CompactRow key={s.id} story={s} thumb />
                  ))}
                </div>
                <Link to={`/c/latest${filter === 'all' ? '' : `?f=${filter}`}`} className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 text-[16px] font-semibold text-ink hover:underline">
                  See all {feed.length} stories <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            )}

            <aside className="flex flex-col gap-10 lg:col-span-4">
              <Link to="/brief" className="press group block bg-ink p-6 text-paper">
                <span className="t-meta text-paper/70">Your 5-minute briefing</span>
                <span className="mt-1.5 block text-[24px] font-bold leading-[28px] tracking-[-0.02em]">The whole issue, one card at a time.</span>
                <span className="mt-5 inline-flex min-h-[44px] items-center gap-1.5 bg-lime px-4 text-[15px] font-bold text-lime-ink">
                  Start briefing <ArrowRight className="h-4 w-4" />
                </span>
              </Link>

              {official.length > 0 && (
                <section>
                  <h2 className="t-section rule-strong pt-3">Straight from the source</h2>
                  <p className="mt-1 text-[15px] text-ink-soft">Confirmed by the company, a regulator or a paper.</p>
                  <ul className="mt-2 border-b border-rule">
                    {official.map((s) => (
                      <li key={s.id}>
                        <Link to={`/story/${s.id}`} className="press group flex flex-col gap-1.5 border-t border-rule py-3.5">
                          <CategoryBadge story={s} />
                          <span className="text-[17px] font-semibold leading-[22px] tracking-[-0.01em] group-hover:underline">
                            <Headline story={s} />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>
          </div>
        </>
      )}

      <LastPage />
    </div>
  )
}

/* ---------- The lead story ---------- */

function Lead({ story, read }: { story: Story; read: boolean }) {
  return (
    <Link to={`/story/${story.id}`} className={`press group mt-5 grid grid-cols-1 gap-x-8 gap-y-4 sm:mt-6 lg:grid-cols-12 ${read ? 'opacity-60' : ''}`}>
      <Photo story={story} size="lg" credit eager className="-mx-4 aspect-[4/3] sm:mx-0 sm:aspect-[16/10] lg:col-span-8" />
      <div className="flex flex-col gap-4 lg:col-span-4 lg:pt-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <TrustMark label={story.label} />
          <CategoryBadge story={story} className="!text-ink" />
        </div>
        <h1
          className={`font-bold tracking-[-0.035em] text-ink group-hover:underline group-hover:decoration-[3px] group-hover:underline-offset-[6px] ${
            story.title.length > 70
              ? 'text-[30px] leading-[32px] sm:text-[38px] sm:leading-[40px]'
              : 'text-[34px] leading-[35px] sm:text-[46px] sm:leading-[47px]'
          }`}
        >
          <Headline story={story} />
        </h1>
        <p className="text-[18px] leading-[27px] text-ink sm:text-[19px]">{story.dek}</p>
        <div className="border-t border-rule pt-3.5">
          <p className="text-[14px] font-bold text-ink">Why it matters</p>
          <p className="mt-1 text-[16.5px] leading-[25px] text-ink-soft">{story.whyItMatters}</p>
        </div>
        <MetaRow story={story} />
      </div>
    </Link>
  )
}

/* ---------- The last page ---------- */

export function LastPage({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`border-t-2 border-ink pt-6 ${compact ? '' : 'mt-16'}`}>
      <p className="t-meta uppercase text-ink-soft">End of issue No. {issueNo()}</p>
      <p className="mt-3 text-[32px] font-bold leading-[34px] tracking-[-0.04em] text-ink sm:text-[44px] sm:leading-[46px]">
        That’s the issue.{' '}
        <br className="sm:hidden" />
        <span className="mark">Go do something good.</span>
      </p>
      <p className="t-meta mt-4 text-ink-soft">No. {issueNo() + 1} comes out tomorrow morning. New stories still arrive through the day.</p>
    </div>
  )
}
