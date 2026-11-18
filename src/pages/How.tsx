import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import PressFigure from '../components/anatomy/PressFigure'
import { STATIONS, type StationId, type Tiers } from '../components/anatomy/press'
import { feedFor, issueNo, todayIssue } from '../lib/feed'
import { usePrefs } from '../lib/prefs'
import { useStories } from '../lib/stories'
import { threadsOf } from '../lib/threads'
import { SUPABASE_KEY, SUPABASE_URL } from '../lib/supabase'
import { TrustMark } from '../components/ui'

// Active sources per tier, read live (the sources table is public).
function useTiers(): Tiers | null {
  const [t, setT] = useState<Tiers | null>(null)
  useEffect(() => {
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('fixture')) return setT({ official: 12, news: 24, signal: 5 })
    fetch(`${SUPABASE_URL}/rest/v1/sources?select=tier&active=eq.true`, { headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${SUPABASE_KEY}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { tier: string }[]) => {
        if (!rows.length) return
        const n = (k: string) => rows.filter((r) => r.tier === k).length
        setT({ official: n('official'), news: n('news'), signal: n('signal') })
      })
      .catch(() => {})
  }, [])
  return t
}

// Short tab names for phones, where five tabs share one row.
const short: Record<StationId, string> = { sources: 'Sources', dedup: 'Merge', label: 'Label', review: 'Check', issue: 'Issue' }

const names: Record<StationId, string> = {
  sources: 'Sources',
  dedup: 'One story, not six',
  label: 'The label',
  review: 'A person checks',
  issue: 'Today’s issue',
}

export default function How() {
  const { prefs } = usePrefs()
  const { stories, articles24h } = useStories()
  const tiers = useTiers()
  const [params, setParams] = useSearchParams()
  const layer = params.get('layer')
  const selected = (STATIONS as string[]).includes(layer ?? '') ? (layer as StationId) : null
  const select = (id: StationId | null) => setParams(id ? { layer: id } : {}, { replace: true })

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') select(null)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Every number on this page comes from the live data the rest of the app reads.
  const facts = useMemo(() => {
    const day = stories.filter((s) => s.hoursAgo <= 24)
    const threads = new Set([...threadsOf(stories).values()])
    const labels = { official: 0, report: 0, rumor: 0 }
    for (const s of stories) labels[s.label]++
    const reviewed = stories.filter((s) => s.importance === 3).length
    const { issue } = todayIssue(feedFor(prefs.topics, prefs.depth))
    return { day: day.length, week: stories.length, events: threads.size, labels, reviewed, issue: issue.length }
  }, [stories, prefs.topics, prefs.depth])
  const totalSources = tiers ? tiers.official + tiers.news + tiers.signal : null
  const stampIndex = selected === 'label' ? 0 : 1

  const at = selected ? STATIONS.indexOf(selected) : -1
  const go = (d: number) => select(STATIONS[(Math.max(0, at) + d + STATIONS.length) % STATIONS.length])

  const readout = selected
    ? {
        sources: totalSources !== null ? `${totalSources} sources` : 'Sources',
        dedup: articles24h !== null ? `${articles24h} articles → ${facts.day} stories` : `${facts.day} stories today`,
        label: `${facts.labels.official} official · ${facts.labels.report} report · ${facts.labels.rumor} rumor`,
        review: `${facts.reviewed} checked by a person`,
        issue: `${facts.issue} stories · No. ${issueNo()}`,
      }[selected]
    : articles24h !== null
      ? `${articles24h} in → ${facts.issue} out`
      : `${facts.issue} stories today`

  return (
    <div className="fade-in px-4 pt-6 sm:px-8 sm:pt-10">
      <Link to="/" className="t-eyebrow -ml-1 inline-flex min-h-[44px] items-center gap-1.5 text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Today’s issue
      </Link>
      <h1 className="mt-2 max-w-3xl text-balance text-[38px] font-bold leading-[40px] tracking-[-0.04em] sm:text-[60px] sm:leading-[60px]">How Unhyped works</h1>
      <p className="mt-4 max-w-2xl text-[19px] leading-[28px] text-ink sm:text-[22px] sm:leading-[32px]">
        {articles24h !== null ? (
          <>
            In the last 24 hours we read <b>{articles24h} articles</b>. You got <span className="mark font-semibold">{facts.issue} stories</span>. This is the machine in between.
          </>
        ) : (
          <>Hundreds of articles go in. A handful of stories come out. This is the machine in between.</>
        )}
      </p>

      <div className="anatomy mt-8 grid grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-12">
        {/* The figure, in a card: Fig. 1 top left, title top right, hint and live readout at the bottom */}
        <figure className="relative self-start border border-ink px-0 pb-11 pt-10 sm:px-6 lg:col-span-8">
          <span className="t-meta absolute left-3 top-3 text-ink">Fig. 1</span>
          <span className="t-meta absolute right-3 top-3 uppercase text-ink-soft">The Unhyped press</span>
          <PressFigure selected={selected} onSelect={select} tiers={tiers ?? { official: 12, news: 24, signal: 5 }} issueSize={facts.issue} stampIndex={stampIndex} issueNo={issueNo()} />
          <span className="t-meta absolute bottom-3 left-3 hidden uppercase text-ink-soft sm:block">{selected ? 'Esc · all parts' : 'Tap a part'}</span>
          <span className="t-meta absolute bottom-3 right-3 max-w-[calc(100%-24px)] truncate text-ink" aria-live="polite">{readout}</span>
        </figure>

        <div className="lg:col-span-4">
          <div role="tablist" aria-label="Parts of the press" className="grid grid-cols-5 border-b-2 border-ink lg:grid-cols-1 lg:border-b-0">
            {STATIONS.map((id, i) => (
              <button
                key={id}
                role="tab"
                aria-selected={selected === id}
                aria-controls="press-part"
                onClick={() => select(selected === id ? null : id)}
                className={`press flex min-h-[48px] flex-col items-start justify-center gap-0.5 px-1.5 py-2 text-left lg:flex-row lg:items-center lg:justify-start lg:gap-3 lg:border-t lg:border-rule lg:px-0 ${selected === id ? 'lg:bg-transparent' : ''}`}
              >
                <span className={`t-meta ${selected === id ? 'bg-lime px-1 text-lime-ink' : 'text-ink-soft'}`}>{String(i + 1).padStart(2, '0')}</span>
                <span className={`text-[13px] font-semibold leading-[16px] sm:text-[15px] lg:text-[17px] ${selected === id ? 'text-ink' : 'text-ink-soft'}`}>
                  <span className="lg:hidden" aria-hidden>{short[id]}</span>
                  <span className="sr-only lg:not-sr-only">{names[id]}</span>
                </span>
              </button>
            ))}
          </div>

          <section id="press-part" role="tabpanel" aria-live="polite" className="mt-5 lg:border-t-2 lg:border-ink lg:pt-4">
            {selected ? <Part id={selected} facts={facts} tiers={tiers} articles24h={articles24h} /> : <Overview />}
            <div className="mt-6 flex items-center justify-between gap-2 border-t border-rule pt-2">
              <button onClick={() => go(-1)} className="press t-eyebrow inline-flex min-h-[44px] items-center gap-1 text-ink-soft hover:text-ink" aria-label="Previous part">
                <ArrowLeft className="h-4 w-4" /> Prev
              </button>
              <button onClick={() => select(null)} disabled={!selected} className="press t-eyebrow min-h-[44px] text-ink-soft hover:text-ink disabled:opacity-40">
                All parts
              </button>
              <button onClick={() => go(selected ? 1 : 0)} className="press t-eyebrow inline-flex min-h-[44px] items-center gap-1 text-ink hover:underline" aria-label="Next part">
                Next <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        </div>
      </div>

      <section className="mt-16 grid grid-cols-1 gap-8 border-t-2 border-ink pt-5 sm:grid-cols-3">
        {[
          ['No buy or sell calls', 'On Tesla we report what happened and how the market moved. Never what to do about it.'],
          ['No ranking by clicks', 'A story ranks by how important it is and how many sources cover it. Not by what got clicked.'],
          ['No endless feed', 'The issue has an end. When you reach it, you’re done for the day.'],
        ].map(([t, d]) => (
          <div key={t}>
            <h2 className="text-[20px] font-bold leading-[24px] tracking-[-0.02em]">{t}</h2>
            <p className="mt-2 text-[16.5px] leading-[25px] text-ink">{d}</p>
          </div>
        ))}
      </section>

      <Link to="/" className="press group mt-12 flex min-h-[44px] items-center justify-between gap-4 border-t-2 border-ink pt-5">
        <span className="text-[24px] font-bold tracking-[-0.02em] group-hover:underline sm:text-[30px]">Read today’s issue</span>
        <span className="grid h-11 w-11 shrink-0 place-items-center bg-lime text-lime-ink">
          <ArrowRight className="h-5 w-5" />
        </span>
      </Link>
    </div>
  )
}

function Overview() {
  return (
    <>
      <h2 className="text-[24px] font-bold leading-[28px] tracking-[-0.025em]">Five steps, every 15 minutes</h2>
      <p className="mt-3 text-[16.5px] leading-[25px] text-ink">
        Articles come in from sources we chose. Copies of the same event are pressed into one story. A rule stamps how sure we are. Important stories wait for a person. What’s left becomes your issue.
      </p>
      <p className="mt-3 text-[16.5px] leading-[25px] text-ink-soft">Tap any part of the machine, or pick a step above.</p>
    </>
  )
}

type Facts = { day: number; week: number; events: number; labels: Record<'official' | 'report' | 'rumor', number>; reviewed: number; issue: number }

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <p className="mt-3 flex items-baseline gap-2">
      <span className="text-[34px] font-bold leading-none tracking-[-0.04em] tnum">{big}</span>
      <span className="text-[15px] text-ink-soft">{small}</span>
    </p>
  )
}

function Part({ id, facts, tiers, articles24h }: { id: StationId; facts: Facts; tiers: Tiers | null; articles24h: number | null }) {
  const p = 'mt-3 text-[16.5px] leading-[25px] text-ink'
  if (id === 'sources')
    return (
      <>
        <h2 className="text-[24px] font-bold leading-[28px] tracking-[-0.025em]">Sources we chose, not the whole web</h2>
        {tiers && <Stat big={String(tiers.official + tiers.news + tiers.signal)} small={`${tiers.official} official · ${tiers.news} news · ${tiers.signal} community`} />}
        <p className={p}>The back row is official: company blogs, regulators and research papers. The middle row is news outlets with a track record. The front row is community signals, which can only ever produce a Rumor.</p>
        <p className={p}>A source that keeps failing is switched off automatically. You can’t add your own sources. That’s on purpose: the list is the filter.</p>
      </>
    )
  if (id === 'dedup')
    return (
      <>
        <h2 className="text-[24px] font-bold leading-[28px] tracking-[-0.025em]">One story, not six versions of it</h2>
        <Stat big={String(facts.day)} small={articles24h !== null ? `stories from ${articles24h} articles in 24 hours` : 'stories in the last 24 hours'} />
        <p className={p}>Every 15 minutes new articles come in. When several outlets cover the same event, the press merges them into one story, and every source stays listed under it, so you can check who said what.</p>
        <p className={p}>A developing event, like a CEO resigning and the board answering, stays one thread. The newest update leads and the rest sit under it.</p>
      </>
    )
  if (id === 'label')
    return (
      <>
        <h2 className="text-[24px] font-bold leading-[28px] tracking-[-0.025em]">The label comes from a rule, not from AI</h2>
        <ul className="mt-4 space-y-3">
          <li className="flex gap-3"><TrustMark label="official" /><span className="text-[15.5px] leading-[22px]">The company, a regulator or a published paper confirms it. <b className="tnum">{facts.labels.official}</b> this week.</span></li>
          <li className="flex gap-3"><TrustMark label="report" /><span className="text-[15.5px] leading-[22px]">Credible outlets report it, no confirmation yet. <b className="tnum">{facts.labels.report}</b> this week.</span></li>
          <li className="flex gap-3"><TrustMark label="rumor" /><span className="text-[15.5px] leading-[22px]">Only forums or posts so far. <b className="tnum">{facts.labels.rumor}</b> this week.</span></li>
        </ul>
        <p className={p}>The strongest source decides. When a company confirms a report, the label changes, and you’ll see it under “Since your last visit”.</p>
      </>
    )
  if (id === 'review')
    return (
      <>
        <h2 className="text-[24px] font-bold leading-[28px] tracking-[-0.025em]">Nothing big goes out on autopilot</h2>
        <Stat big={String(facts.reviewed)} small="top stories this week, each checked by a person" />
        <p className={p}>AI writes the summary and scores how important a story is. Anything scored most important waits at the gate until an editor reads it, opens the sources, and approves, edits or rejects it.</p>
        <p className={p}>A story that breaks our writing rules, like hype words or a missing source, is sent back to be rewritten before anyone sees it.</p>
      </>
    )
  return (
    <>
      <h2 className="text-[24px] font-bold leading-[28px] tracking-[-0.025em]">An issue that ends</h2>
      <Stat big={String(facts.issue)} small={`stories in issue No. ${issueNo()}`} />
      <p className={p}>Every morning gets a numbered issue: the most important confirmed stories of the last 24 hours, one per event, with rumors kept apart. How many you see depends on how much you asked to know.</p>
      <p className={p}>When you reach the end of the issue, it ends. New stories still arrive through the day.</p>
    </>
  )
}
