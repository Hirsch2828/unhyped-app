import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { applyFilter, feedFor, homeChips, issueNo, timeAgo, todayIssue } from '../lib/feed'
import { usePrefs, type Snap } from '../lib/prefs'
import { useStories } from '../lib/stories'
import { siblingsOf, threadsOf, onePerThread } from '../lib/threads'
import type { Story } from '../data/types'
import { HypeTag } from '../components/StoryParts'
import { CategoryBadge, CompactRow, Headline, MetaRow, Photo, StoryCard, TrustMark, hasPicture } from '../components/ui'

// Changed since you read it: more sources, a new label or a new headline.
export const changedSince = (s: Story, snap?: Snap) =>
  !!snap && (s.mergedCount > snap.sources || s.label !== snap.label || s.title !== snap.title)

export default function Home() {
  const { prefs } = usePrefs()
  const { articles24h, stories } = useStories()
  const [params, setParams] = useSearchParams()
  const chips = homeChips(prefs.topics, prefs.depth, prefs.own)
  const filter = chips.some((c) => c.id === params.get('f')) ? params.get('f')! : 'all'
  const onlyChanged = params.get('since') === '1'
  const pick = (id: string) => setParams(id === 'all' ? {} : { f: id }, { replace: true })

  const feed = applyFilter(feedFor(prefs.topics, prefs.depth, prefs.own), filter)
  const { issue, quiet } = todayIssue(feed)
  const [lead, ...also] = issue
  // Hide every story whose event is already in the issue; its other developments sit under it.
  const threads = threadsOf(stories)
  const shown = new Set(issue.flatMap((s) => (threads.get(s.id) ?? [s]).map((x) => x.id)))

  // Since your last visit
  const prev = prefs.prevVisit
  const fresh = prev ? feed.filter((s) => Date.now() - s.hoursAgo * 3600_000 > prev && !prefs.read.includes(s.id)) : []
  const changed = feed.filter((s) => changedSince(s, prefs.snaps[s.id]))
  const sinceList = [...new Map([...changed, ...fresh].map((s) => [s.id, s])).values()]

  // Everything else: today first, then the rest of the week by importance. Each story once.
  const rest = onePerThread(
    feed
      .filter((s) => !shown.has(s.id))
      .sort((a, b) => Number(b.hoursAgo <= 24) - Number(a.hoursAgo <= 24) || b.importance - a.importance || a.hoursAgo - b.hoursAgo),
    stories,
  )
  const official = rest.filter((s) => s.label === 'official').slice(0, 4)
  const officialIds = new Set(official.map((s) => s.id))
  const list = rest.filter((s) => !officialIds.has(s.id)).slice(0, 10)

  // Today in 30 seconds: three real things, and one claim that fell apart (or, failing that, one still unconfirmed).
  const debunked = stories.filter((s) => s.debunked && prefs.topics.includes(s.topic)).sort((a, b) => a.hoursAgo - b.hoursAgo)
  const real = issue.filter((s) => s.label !== 'rumor').slice(0, 3)
  const doubt = debunked[0] ?? feed.filter((s) => s.label === 'rumor').sort((a, b) => a.hoursAgo - b.hoursAgo)[0]

  const intro = quiet
    ? 'Quiet day. Nothing new held up in the last 48 hours, so here are the latest stories.'
    : articles24h !== null
      ? `We read ${articles24h} articles in the last 24 hours. ${issue.length === 1 ? 'This one is' : `These ${issue.length} are`} worth your time.`
      : `${issue.length} stories worth your time today.`

  return (
    <div className="fade-in px-4 pb-2 sm:px-8">
      <div className="flex flex-col gap-3 pt-5 sm:pt-7 lg:flex-row lg:items-center lg:justify-between">
        {articles24h !== null && !quiet ? (
          // The cover line: the noise we read, struck through, and what made the issue.
          <p className="text-[22px] font-bold leading-[28px] tracking-[-0.025em] text-ink sm:text-[28px] sm:leading-[34px]">
            <s className="font-medium text-ink-soft decoration-2">{articles24h} articles</s>. Taken apart.{' '}
            <span className="mark">{issue.length} stories</span> left.{' '}
            <Link to="/how" className="whitespace-nowrap text-[15px] font-semibold tracking-normal text-ink-soft underline decoration-1 underline-offset-[3px] hover:text-ink sm:text-[16px]">
              How we choose
            </Link>
          </p>
        ) : (
          <p className="text-[16px] leading-6 text-ink-soft sm:text-[18px]">{intro}</p>
        )}
        <nav aria-label="Filter by desk" className="no-scrollbar -mx-4 flex overflow-x-auto px-3 lg:mx-0 lg:flex-wrap lg:px-0">
          {chips.slice(0, 6).map((c) => (
            <button key={c.id} onClick={() => pick(c.id)} aria-pressed={filter === c.id} className="press flex h-11 shrink-0 items-center px-1">
              <span className={`flex h-8 items-center px-2.5 text-[14px] font-semibold ${filter === c.id ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>{c.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {!onlyChanged && filter === 'all' && real.length > 0 && <ThirtySeconds real={real} doubt={doubt} />}

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
          {lead ? <Lead story={lead} read={prefs.read.includes(lead.id)} more={siblingsOf(lead, stories)} /> : <p className="mt-10 text-[18px] text-ink-soft">{filter.startsWith('own:') ? `Not much on ${filter.slice(4)} this week. We’ll add stories as soon as our sources mention it.` : 'No stories on this desk this week.'}</p>}

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

              {debunked.length > 0 && <Debunked list={debunked.slice(0, 4)} />}

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
                            <Headline story={s} mark={false} />
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

/* ---------- Today in 30 seconds ---------- */

function ThirtySeconds({ real, doubt }: { real: Story[]; doubt?: Story }) {
  return (
    <section aria-labelledby="t30" className="mt-5 border-2 border-ink p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="t30" className="text-[18px] font-bold tracking-[-0.01em] text-ink">Today in 30 seconds</h2>
        <span className="t-meta text-ink-soft">{real.length} real{doubt ? ' · 1 not' : ''}</span>
      </div>
      <ol className="mt-2">
        {real.map((s) => (
          <li key={s.id}>
            <Link to={`/story/${s.id}`} className="press group flex min-h-[44px] items-baseline gap-3 border-t border-rule py-2.5">
              <span aria-hidden className="w-5 shrink-0 font-mono font-bold text-ink">✓</span>
              <span className="min-w-0 flex-1 text-[16.5px] font-semibold leading-[23px] text-ink group-hover:underline">{s.title}</span>
              <span className="sr-only">Real.</span>
            </Link>
          </li>
        ))}
        {doubt && (
          <li>
            <Link to={`/story/${doubt.id}`} className="press group flex min-h-[44px] items-baseline gap-3 border-t border-rule py-2.5">
              <span aria-hidden className="w-5 shrink-0 font-mono font-bold text-ink">{doubt.debunked ? '✗' : '?'}</span>
              <span className="min-w-0 flex-1 text-[16.5px] leading-[23px] text-ink">
                <span className="t-tag mr-2 bg-ink px-1 text-paper">{doubt.debunked ? 'Debunked' : 'Not confirmed'}</span>
                <span className={doubt.debunked ? 'text-ink-soft line-through' : 'group-hover:underline'}>{doubt.title}</span>
                {doubt.debunked && doubt.debunkNote && <span className="mt-0.5 block text-[15px] text-ink">{doubt.debunkNote}</span>}
              </span>
            </Link>
          </li>
        )}
      </ol>
    </section>
  )
}

/* ---------- Debunked: stories that turned out wrong stay, crossed out ---------- */

function Debunked({ list }: { list: Story[] }) {
  return (
    <section>
      <h2 className="t-section rule-strong pt-3">Debunked</h2>
      <p className="mt-1 text-[15px] text-ink-soft">Claims that fell apart, and what really happened.</p>
      <ul className="mt-2 border-b border-rule">
        {list.map((s) => (
          <li key={s.id}>
            <Link to={`/story/${s.id}`} className="press group block border-t border-rule py-3.5">
              <span className="block text-[16px] leading-[22px] text-ink-soft line-through">{s.title}</span>
              <span className="mt-1 block text-[15.5px] font-semibold leading-[22px] text-ink group-hover:underline">{s.debunkNote || 'This turned out to be wrong.'}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ---------- The lead story ---------- */

function Lead({ story, read, more }: { story: Story; read: boolean; more: Story[] }) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 sm:mt-6 lg:grid-cols-12">
      {hasPicture(story) ? (
        <Link to={`/story/${story.id}`} tabIndex={-1} aria-hidden className="press -mx-4 sm:mx-0 lg:col-span-8">
          <Photo story={story} size="lg" credit eager className="aspect-[4/3] sm:aspect-[16/10]" />
        </Link>
      ) : (
        // No picture: the headline itself is the cover, set big across the wide column.
        <div className="border-t-2 border-ink pt-4 lg:col-span-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <TrustMark label={story.label} />
            <CategoryBadge story={story} className="!text-ink" />
            <HypeTag story={story} />
          </div>
          <h1 className="mt-4 text-balance text-[38px] font-bold leading-[39px] tracking-[-0.04em] text-ink sm:text-[64px] sm:leading-[62px] lg:text-[72px] lg:leading-[70px]">
            <Link to={`/story/${story.id}`} className="hover:underline hover:decoration-[4px] hover:underline-offset-[8px]">
              <Headline story={story} mark />
            </Link>
          </h1>
          <p className="mt-5 max-w-[640px] text-[19px] leading-[28px] text-ink sm:text-[22px] sm:leading-[32px]">{story.dek}</p>
        </div>
      )}
      <div className={`flex flex-col gap-4 lg:col-span-4 lg:row-span-2 ${hasPicture(story) ? 'lg:pt-1' : 'lg:border-t-2 lg:border-ink lg:pt-4'}`}>
        {hasPicture(story) && (
          <>
        <div className="flex flex-wrap items-center gap-2.5">
          <TrustMark label={story.label} />
          <CategoryBadge story={story} className="!text-ink" />
            <HypeTag story={story} />
        </div>
        <h1
          className={`text-balance font-bold tracking-[-0.035em] text-ink ${
            story.title.length > 70
              ? 'text-[30px] leading-[32px] sm:text-[38px] sm:leading-[40px]'
              : 'text-[34px] leading-[35px] sm:text-[46px] sm:leading-[47px]'
          }`}
        >
          <Link to={`/story/${story.id}`} className="hover:underline hover:decoration-[3px] hover:underline-offset-[6px]">
            <Headline story={story} mark />
          </Link>
        </h1>
        <p className="text-[18px] leading-[27px] text-ink sm:text-[19px]">{story.dek}</p>
          </>
        )}
        <div className={hasPicture(story) ? 'border-t border-rule pt-3.5' : ''}>
          <p className="text-[14px] font-bold text-ink">Why it matters</p>
          <p className="mt-1 text-[16.5px] leading-[25px] text-ink">{story.whyItMatters}</p>
        </div>
        <MetaRow story={story} read={read} />
      </div>
      {more.length > 0 && (
        <div className="border-t-2 border-ink pt-3 lg:col-span-8 lg:mt-2">
          <p className="text-[14px] font-bold text-ink">
            Developing · {more.length} more {more.length === 1 ? 'update' : 'updates'} on this
          </p>
          <ul className="mt-1">
            {more.slice(0, 3).map((s) => (
              <li key={s.id}>
                <Link to={`/story/${s.id}`} className="press group flex min-h-[44px] items-baseline gap-3 border-t border-rule py-2.5">
                  <span className="t-meta w-9 shrink-0 text-ink-soft">{timeAgo(s.hoursAgo).replace(' ago', '')}</span>
                  <span className="text-[15.5px] font-medium leading-[21px] text-ink group-hover:underline">{s.title}</span>
                </Link>
              </li>
            ))}
          </ul>
          {more.length > 3 && (
            <Link to={`/story/${story.id}`} className="t-eyebrow inline-flex min-h-[44px] items-center gap-1 text-ink-soft hover:text-ink">
              All {more.length} updates <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}
    </div>
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
