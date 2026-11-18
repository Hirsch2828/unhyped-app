import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ExternalLink, Share2 } from 'lucide-react'
import { ensureStories, findStory, useStories } from '../lib/stories'
import { usePrefs, type Snap } from '../lib/prefs'
import { feedFor, timeAgo, todayIssue } from '../lib/feed'
import type { Story } from '../data/types'
import PriceChart from '../components/PriceChart'
import { AnatomyButton, BullBear, HypeMeter, WatchNext, WhyItMatters } from '../components/StoryParts'
import { CategoryBadge, CompactRow, Headline, Photo, SaveButton, TrustMark, plural } from '../components/ui'
import SignupSheet from '../components/SignupSheet'
import { onePerThread, siblingsOf } from '../lib/threads'

// One sentence that explains why the story carries its label (decided by rule, not by AI).
export function statusLine(s: Story) {
  if (s.label === 'official') {
    const who = s.sources.find((x) => x.kind === 'Company')?.name
    return who ? `Confirmed by an official source: ${who}.` : 'Confirmed by an official source.'
  }
  if (s.label === 'report') {
    const outlets = s.sources.filter((x) => x.kind === 'News').length || s.sources.length
    return `Reported by ${plural(outlets, 'outlet')}. No official confirmation yet.`
  }
  return 'Only forums or social posts so far. No outlet or company has confirmed it.'
}

export default function StoryPage() {
  const { id = '' } = useParams()
  const { stories, mode } = useStories()
  const story = findStory(id)
  useEffect(() => {
    if (mode === 'live' && !story) ensureStories([id])
  }, [mode, id, story])
  const nav = useNavigate()
  const { prefs, remember } = usePrefs()
  const [sheet, setSheet] = useState(false)
  const [copied, setCopied] = useState(false)
  const [progress, setProgress] = useState(0)
  // What the story looked like the last time you read it (captured before this visit overwrites it).
  const [prevSnap, setPrevSnap] = useState<Snap | undefined>(undefined)
  const captured = useRef<string | null>(null)

  useEffect(() => {
    if (!story || captured.current === story.id) return
    captured.current = story.id
    setPrevSnap(prefs.snaps[story.id])
    remember(story)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, !!story])

  // Reading progress for the thin bar under the top bar.
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [id])

  if (!story)
    return (
      <div className="p-8 text-center text-ink-soft">
        This story isn’t here anymore. <Link to="/" className="text-ink underline">Back to today’s issue</Link>
      </div>
    )

  const onSaved = () => {
    if (!prefs.email && !prefs.signupDismissed) setSheet(true)
  }
  const share = async () => {
    // A share link with a real preview card (see api/share.js), not the bare #/ app URL.
    const url = `${window.location.origin}/s/${story.id}`
    try {
      if (navigator.share) await navigator.share({ title: story.title, url })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      }
    } catch {
      /* user cancelled */
    }
  }
  const { issue } = todayIssue(feedFor(prefs.topics, prefs.depth, prefs.own))
  const at = issue.findIndex((s) => s.id === story.id)
  const next = at >= 0 ? issue[at + 1] : undefined
  // The same event's other developments first, then related stories (one per event).
  const developing = siblingsOf(story, stories)
  const devIds = new Set(developing.map((s) => s.id))
  const others = stories.filter((s) => s.id !== story.id && !devIds.has(s.id) && prefs.topics.includes(s.topic))
  const related = onePerThread(
    [...others.filter((s) => s.area && s.area === story.area), ...others.filter((s) => s.topic === story.topic && s.area !== story.area)],
    stories,
  ).slice(0, 4)
  const hasPicture = !!story.photo || !!story.ownImage
  const delta = deltaOf(story, prevSnap)
  const paragraphs = story.whatHappened.split(/\n\s*\n/).filter(Boolean)
  const facts = story.claims?.length ? story.claims : story.takeaways.map((t) => ({ text: t, n: 0 }))
  const unclear = story.uncertain ?? []

  const deltaBox = delta.length > 0 && (
    <div className="border-2 border-ink p-4">
      <p className="text-[15px] font-bold text-ink">
        <span className="mark">Δ</span> Since you read this · {timeAgo(Math.round((Date.now() - (prevSnap?.at ?? Date.now())) / 3600_000))}
      </p>
      <ul className="mt-2 space-y-1.5">
        {delta.map((d) => (
          <li key={d.what + d.to} className="text-[15px] leading-[21px] text-ink">
            <span className="t-tag mr-2 text-ink-soft">{d.what}</span>
            {d.from && <span className="mr-1.5 text-ink-faint line-through">{d.from}</span>}
            {d.from && <span aria-hidden className="mr-1.5">→</span>}
            <span className="font-semibold">{d.to}</span>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <article className="fade-in">
      {/* Top bar: back to the issue, place in the issue, share and save; a thin reading-progress line */}
      <div className="sticky top-0 z-30 bg-paper">
        <div className="flex h-14 items-center justify-between px-1 sm:px-6">
          <button
            onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))}
            className="press inline-flex min-h-[44px] items-center gap-2 px-2.5 text-[15px] font-semibold text-ink"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Today’s issue</span>
          </button>
          {at >= 0 && <span className="t-meta text-ink-soft">Story {at + 1} of {issue.length}</span>}
          <div className="flex">
            <button onClick={share} className="press grid h-11 w-11 place-items-center text-ink" aria-label={copied ? 'Link copied' : 'Share this story'}>
              {copied ? <span className="t-eyebrow">Copied</span> : <Share2 className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            </button>
            <SaveButton story={story} onSaved={onSaved} className="!text-ink" />
          </div>
        </div>
        <div className="h-[3px] bg-ink/10" aria-hidden>
          <div className="h-[3px] bg-ink" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-x-14 gap-y-12 px-4 pt-6 sm:px-8 sm:pt-8">
        <div className="min-w-0 max-w-[760px] flex-[999_1_560px]">
          <div className="flex flex-wrap items-center gap-2.5">
            <TrustMark label={story.label} explain />
            <CategoryBadge story={story} className="!text-ink" />
            <span className="sm:ml-auto">
              <AnatomyButton story={story} />
            </span>
          </div>
          {story.debunked && (
            <div className="mt-4 border-2 border-ink p-4">
              <p className="t-eyebrow text-ink">Debunked</p>
              <p className="mt-1 text-[16px] leading-[24px] text-ink">{story.debunkNote || 'This story turned out to be wrong.'}</p>
            </div>
          )}
          <h1 className={`mt-4 text-[36px] font-bold leading-[37px] tracking-[-0.04em] text-ink sm:text-[56px] sm:leading-[56px] ${story.debunked ? 'line-through decoration-[3px]' : ''}`}>
            <Headline story={story} mark={!story.debunked} />
          </h1>
          <p className="mt-4 text-[19px] leading-[28px] text-ink sm:text-[22px] sm:leading-[32px]">{story.dek}</p>
          {story.hypeTitle && (
            <p className="mt-3 text-[15px] text-ink-soft">
              <span className="font-semibold">Elsewhere: </span>
              <span className="line-through decoration-ink-soft">“{story.hypeTitle}”</span>
            </p>
          )}
          <p className="mt-5 border-y border-rule py-3 text-[15px] leading-[22px] text-ink-soft">
            <b className="text-ink">Why “{story.label === 'official' ? 'Official' : story.label === 'report' ? 'Report' : 'Rumor'}”:</b> {statusLine(story)}{' '}
            <Link to={`/how?layer=label`} className="font-semibold text-ink underline decoration-1 underline-offset-[3px] hover:decoration-2">
              How labels work
            </Link>
            <span className="t-meta mt-1 block">
              {timeAgo(story.hoursAgo)} · {story.readMinutes} min read
            </span>
          </p>
          <div className="mt-4">
            <HypeMeter story={story} />
          </div>

          {deltaBox && <div className="mt-6 lg:hidden">{deltaBox}</div>}

          {hasPicture && (
            <figure className="-mx-4 mt-7 sm:mx-0">
              <Photo story={story} size="lg" credit eager className="aspect-[16/10] w-full sm:aspect-[16/9]" />
            </figure>
          )}

          <h2 className="t-section mt-10 sm:text-[26px] sm:leading-[30px]">The short version</h2>
          <ol className="mt-4 space-y-3.5">
            {facts.map((c, i) => (
              <li key={c.text} className="flex gap-4 text-[18px] leading-[27px] text-ink sm:text-[19px] sm:leading-[29px]">
                <span className="t-meta w-6 shrink-0 pt-1.5 font-semibold text-ink">{String(i + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1">
                  {c.text}
                  {c.n > 1 && <span className="t-meta ml-2 whitespace-nowrap text-ink-soft">· {c.n} sources</span>}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-9">
            <WhyItMatters story={story} />
          </div>

          {paragraphs.length > 0 && (
            <>
              <h2 className="t-section mt-10 sm:text-[26px] sm:leading-[30px]">What happened</h2>
              <div className="mt-3 space-y-4">
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-[18px] leading-[29px] text-ink sm:text-[19px] sm:leading-[31px]">
                    {p}
                  </p>
                ))}
              </div>
            </>
          )}
          <WatchNext story={story} />
          <BullBear story={story} />

          {(story.ticker || story.marketReaction) && (
            <section>
              <h2 className="t-section mt-10 sm:text-[26px] sm:leading-[30px]">Market reaction</h2>
              {story.marketReaction && <p className="mt-3 text-[17px] leading-[27px] text-ink">{story.marketReaction}</p>}
              {story.ticker ? (
                <div className="mt-4">
                  <PriceChart ticker={story.ticker} at={story.publishedAt ?? new Date(Date.now() - story.hoursAgo * 3600_000).toISOString()} />
                </div>
              ) : (
                <p className="t-meta mt-2 text-ink-soft">What happened, not advice. We never say buy or sell.</p>
              )}
            </section>
          )}

          {unclear.length > 0 && (
            <>
              <h2 className="t-section mt-10 sm:text-[26px] sm:leading-[30px]">Still unclear</h2>
              <ul className="mt-3 space-y-2.5">
                {unclear.map((u) => (
                  <li key={u} className="flex gap-3 text-[18px] leading-[28px] text-ink">
                    <span aria-hidden className="font-mono font-semibold">?</span>
                    {u}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-10 lg:sticky lg:top-24">
          {deltaBox && <div className="hidden lg:block">{deltaBox}</div>}
          <section>
            <h2 className="t-section rule-strong pt-3">Sources ({story.sources.length || story.mergedCount})</h2>
            <SourceTable story={story} />
          </section>
          {developing.length > 0 && (
            <section id="developing">
              <h2 className="t-section rule-strong pt-3">Developing story</h2>
              <p className="mt-1 text-[15px] text-ink-soft">{plural(developing.length, 'more update')} on the same event, newest first.</p>
              <ol className="mt-2 border-b border-rule">
                {developing.map((s) => (
                  <li key={s.id}>
                    <Link to={`/story/${s.id}`} className="press group flex min-h-[44px] items-baseline gap-3 border-t border-rule py-3">
                      <span className="t-meta w-10 shrink-0 text-ink-soft">{timeAgo(s.hoursAgo).replace(' ago', '')}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[16px] font-semibold leading-[22px] text-ink group-hover:underline">{s.title}</span>
                        <span className="mt-1.5 block">
                          <TrustMark label={s.label} />
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {related.length > 0 && (
            <section>
              <h2 className="t-section rule-strong pt-3">Related</h2>
              <div className="mt-1 border-b border-rule">
                {related.map((s) => (
                  <CompactRow key={s.id} story={s} thumb />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-8">
        {next ? (
          <Link to={`/story/${next.id}`} className="press group mt-14 flex min-h-[44px] items-center justify-between gap-4 border-t-2 border-ink pt-5">
            <span className="min-w-0">
              <span className="block text-[15px] text-ink-soft">Next in today’s issue · {at + 2} of {issue.length}</span>
              <span className="mt-1 block text-[22px] font-bold leading-[26px] tracking-[-0.02em] group-hover:underline sm:text-[26px] sm:leading-[30px]">{next.title}</span>
            </span>
            <span className="grid h-11 w-11 shrink-0 place-items-center bg-lime text-lime-ink">
              <ArrowRight className="h-5 w-5" />
            </span>
          </Link>
        ) : (
          <Link to="/" className="press group mt-14 flex min-h-[44px] items-center justify-between gap-4 border-t-2 border-ink pt-5">
            <span className="text-[22px] font-bold tracking-[-0.02em] group-hover:underline">Back to today’s issue</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        )}
      </div>

      {sheet && <SignupSheet onClose={() => setSheet(false)} />}
    </article>
  )
}

const stanceMark = { agrees: '✓', adds: '+', differs: '≠' } as const
const stanceText = { agrees: 'Agrees', adds: 'Adds detail', differs: 'Differs' } as const

// One row per source: what it says and whether it agrees, adds or differs. Many sources that only
// agree are folded into one line, so the list doesn't pretend to be many independent confirmations.
function SourceTable({ story }: { story: Story }) {
  const [all, setAll] = useState(false)
  const notes = new Map((story.sourceNotes ?? []).map((n) => [n.source, n]))
  const rows = story.sources.map((s) => ({ ...s, note: notes.get(s.name) }))
  const keyRows = rows.filter((r) => r.note && r.note.stance !== 'agrees')
  const ordered = [...keyRows, ...rows.filter((r) => !keyRows.includes(r))]
  const visible = all ? ordered : ordered.slice(0, Math.max(5, keyRows.length))
  const hidden = ordered.length - visible.length
  return (
    <>
      <p className="t-meta mb-2 mt-1 text-ink-soft">
        {story.sources.length < story.mergedCount
          ? `${plural(story.mergedCount, 'article')} from ${plural(story.sources.length, 'source')}`
          : `${plural(story.mergedCount, 'article')} merged into this story`}
        {' · '}✓ agrees · + adds detail · ≠ differs
      </p>
      <ul className="border-b border-rule">
        {visible.map((s) => (
          <li key={s.name + s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="group flex min-h-[56px] gap-3 border-t border-rule py-3">
              <span
                aria-label={s.note ? stanceText[s.note.stance] : 'Covers the story'}
                className={`grid h-6 w-6 shrink-0 place-items-center border text-[13px] font-bold ${s.note?.stance === 'differs' ? 'border-dashed border-ink' : 'border-ink'} ${s.note?.stance === 'adds' ? 'bg-ink text-paper' : 'text-ink'}`}
              >
                {s.note ? stanceMark[s.note.stance] : '·'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold leading-5 text-ink group-hover:underline">{s.name}</span>
                  <span className="t-meta shrink-0 text-ink-soft">{s.kind}</span>
                </span>
                <span className="mt-0.5 block text-[14px] leading-[20px] text-ink-soft">{s.note?.note || s.claim}</span>
              </span>
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
            </a>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button onClick={() => setAll(true)} className="press t-eyebrow mt-1 min-h-[44px] text-ink-soft hover:text-ink">
          + {hidden} more {hidden === 1 ? 'source covers' : 'sources cover'} the same story
        </button>
      )}
    </>
  )
}

// What changed since your last read: more sources, a new label, a new headline, new key points.
function deltaOf(s: Story, snap?: Snap) {
  if (!snap) return []
  const out: { what: string; from?: string; to: string }[] = []
  const name = { official: 'Official', report: 'Report', rumor: 'Rumor' }
  if (s.label !== snap.label) out.push({ what: 'Label', from: name[snap.label], to: name[s.label] })
  if (s.mergedCount > snap.sources) out.push({ what: 'Sources', from: String(snap.sources), to: String(s.mergedCount) })
  if (s.title !== snap.title) out.push({ what: 'Headline', from: snap.title, to: s.title })
  for (const t of s.takeaways.filter((t) => !snap.takeaways.includes(t)).slice(0, 2)) out.push({ what: 'New', to: t })
  return out
}
