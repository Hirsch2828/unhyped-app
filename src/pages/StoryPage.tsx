import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ExternalLink, Share2 } from 'lucide-react'
import { findStory, useStories } from '../lib/stories'
import { usePrefs, type Snap } from '../lib/prefs'
import { issueNo, timeAgo } from '../lib/feed'
import type { Story } from '../data/types'
import { CategoryBadge, CompactRow, Headline, SaveButton, TrustMark, labelHint, plural } from '../components/ui'
import SignupSheet from '../components/SignupSheet'

const LAYERS = ['30 sec', 'What happened', 'Known', 'Unclear', 'Sources'] as const

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
  const { stories } = useStories()
  const story = findStory(id)
  const nav = useNavigate()
  const { prefs, remember } = usePrefs()
  const [sheet, setSheet] = useState(false)
  const [copied, setCopied] = useState(false)
  const [depth, setDepth] = useState(1)
  // What the story looked like the last time you read it (captured before this visit overwrites it).
  const [prevSnap, setPrevSnap] = useState<Snap | undefined>(undefined)
  const captured = useRef<string | null>(null)
  const layerRefs = useRef<(HTMLElement | null)[]>([])

  useEffect(() => {
    if (!story || captured.current === story.id) return
    captured.current = story.id
    setPrevSnap(prefs.snaps[story.id])
    setDepth(1)
    remember(story)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, !!story])

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
    const url = window.location.href
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
  const goTo = (n: number) => {
    setDepth((d) => Math.max(d, n))
    requestAnimationFrame(() => layerRefs.current[n - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const others = stories.filter((s) => s.id !== story.id && prefs.topics.includes(s.topic))
  const related = [
    ...others.filter((s) => s.area && s.area === story.area),
    ...others.filter((s) => s.topic === story.topic && s.area !== story.area),
  ].slice(0, 4)
  const delta = deltaOf(story, prevSnap)
  const paragraphs = story.whatHappened.split(/\n\s*\n/).filter(Boolean)
  const layer = (n: number) => (el: HTMLElement | null) => {
    layerRefs.current[n - 1] = el
  }

  return (
    <article className="fade-in">
      {/* Top bar with the depth ruler */}
      <div className="sticky top-0 z-30 border-b-2 border-ink bg-paper sm:top-16">
        <div className="mx-auto flex h-12 max-w-3xl items-center justify-between px-2 sm:px-6">
          <button
            onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))}
            className="press grid h-11 w-11 place-items-center text-ink"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="t-meta text-ink-soft">No. {issueNo()}</span>
          <div className="flex">
            <button onClick={share} className="press grid h-11 w-11 place-items-center text-ink" aria-label={copied ? 'Link copied' : 'Share this story'}>
              {copied ? <span className="t-eyebrow">Copied</span> : <Share2 className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            </button>
            <SaveButton story={story} onSaved={onSaved} className="!text-ink" />
          </div>
        </div>
        <nav aria-label="Depth" className="mx-auto grid max-w-3xl grid-cols-5 gap-1 px-4 pb-2 sm:px-8">
          {LAYERS.map((l, i) => (
            <button key={l} onClick={() => goTo(i + 1)} className="group flex min-h-[44px] flex-col justify-end text-left" aria-current={depth === i + 1 ? 'step' : undefined}>
              <span className={`t-eyebrow truncate text-[9.5px] ${i < depth ? 'text-ink' : 'text-ink-soft'}`}>{l}</span>
              <span className={`mt-1 block h-[5px] ${i + 1 === depth ? 'bg-lime ring-1 ring-ink' : i < depth ? 'bg-ink' : 'bg-ink/15'}`} />
            </button>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-3xl px-6 sm:px-8">
        {/* Layer 1: the 30-second read */}
        <section ref={layer(1)} className="scroll-mt-28 pt-5">
          {story.hypeTitle && (
            <p className="t-meta mb-3 text-ink-soft">
              <span className="t-eyebrow mr-1.5">Elsewhere:</span>
              <span className="line-through decoration-ink-soft">“{story.hypeTitle}”</span>
            </p>
          )}
          <CategoryBadge story={story} />
          <h1 className="t-display mt-2 text-ink sm:text-[46px] sm:leading-[46px]">
            <Headline story={story} />
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-rule py-2.5">
            <TrustMark label={story.label} explain />
            <span className="t-meta text-ink">{statusLine(story)}</span>
          </div>
          <p className="t-meta mt-2 text-ink-soft">
            {timeAgo(story.hoursAgo)} · {plural(story.sources.length || story.mergedCount, 'source')} · {story.readMinutes} min
          </p>

          {delta.length > 0 && (
            <div className="mt-5 border-2 border-ink p-4">
              <p className="t-eyebrow text-ink">
                <span className="mark">Δ</span> Since you read this · {timeAgo(Math.round((Date.now() - (prevSnap?.at ?? Date.now())) / 3600_000))}
              </p>
              <ul className="mt-2 space-y-1.5">
                {delta.map((d) => (
                  <li key={d.what} className="text-[15px] leading-[21px] text-ink">
                    <span className="t-eyebrow mr-2 text-ink-soft">{d.what}</span>
                    {d.from && <span className="mr-1.5 text-ink-faint line-through">{d.from}</span>}
                    {d.from && <span aria-hidden className="mr-1.5">→</span>}
                    <span className="font-semibold">{d.to}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="t-body mt-5 text-[18px] leading-[27px] text-ink">{story.dek}</p>
          <div className="mt-5 border-l-[3px] border-ink pl-4">
            <p className="t-eyebrow text-ink">Why it matters</p>
            <p className="mt-1.5 text-[17px] font-medium leading-[25px] text-ink">{story.whyItMatters}</p>
          </div>
          {depth === 1 && <Deeper onClick={() => goTo(2)} next="What happened" />}
        </section>

        {/* Layer 2: what happened */}
        {depth >= 2 && (
          <section ref={layer(2)} className="scroll-mt-28 pt-8">
            <LayerHead n={2} title="What happened" />
            <div className="space-y-4 text-ink">
              {paragraphs.map((p, i) => (
                <p key={i} className={`t-body ${i === 0 ? 'first-letter:float-left first-letter:mr-2 first-letter:text-[52px] first-letter:font-bold first-letter:leading-[44px]' : ''}`}>
                  {p}
                </p>
              ))}
            </div>
            {story.marketReaction && (
              <div className="mt-6 border-t border-rule pt-4">
                <p className="t-eyebrow text-ink-soft">How the market reacted</p>
                <p className="t-body mt-1.5 text-ink">{story.marketReaction}</p>
                <p className="t-meta mt-2 text-ink-soft">Unhyped reports what happened. We never give buy or sell advice.</p>
              </div>
            )}
            {depth === 2 && <Deeper onClick={() => goTo(3)} next="What we know" />}
          </section>
        )}

        {/* Layer 3: what we know, each fact with how many sources back it */}
        {depth >= 3 && (
          <section ref={layer(3)} className="scroll-mt-28 pt-8">
            <LayerHead n={3} title="What we know" />
            <ul className="border-b border-rule">
              {(story.claims?.length ? story.claims : story.takeaways.map((t) => ({ text: t, n: 0 }))).map((c) => (
                <li key={c.text} className="flex gap-3 border-t border-rule py-3">
                  <span className="min-w-0 flex-1 text-[16px] leading-[24px] text-ink">{c.text}</span>
                  {c.n > 0 && (
                    <span className="t-meta shrink-0 pt-0.5 text-ink-soft" title={`${plural(c.n, 'article')} back this`} aria-label={`${plural(c.n, 'article')} back this`}>
                      {'▮'.repeat(Math.min(c.n, 5))}
                      {c.n > 5 ? '+' : ''}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="t-meta mt-2 text-ink-soft">Each bar is one article that backs the fact.</p>
            {depth === 3 && <Deeper onClick={() => goTo(4)} next="What’s still unclear" />}
          </section>
        )}

        {/* Layer 4: what is still uncertain */}
        {depth >= 4 && (
          <section ref={layer(4)} className="scroll-mt-28 pt-8">
            <LayerHead n={4} title="Still unclear" />
            <ul className="space-y-2.5">
              {story.label !== 'official' && (
                <li className="flex gap-3 text-[16px] leading-[24px] text-ink">
                  <span aria-hidden className="font-mono font-semibold">?</span>
                  {labelHint(story.label)}
                </li>
              )}
              {(story.uncertain ?? []).map((u) => (
                <li key={u} className="flex gap-3 text-[16px] leading-[24px] text-ink">
                  <span aria-hidden className="font-mono font-semibold">?</span>
                  {u}
                </li>
              ))}
            </ul>
            {story.label === 'official' && !story.uncertain?.length && (
              <p className="t-body text-ink-soft">The sources don’t flag any open questions.</p>
            )}
            {depth === 4 && <Deeper onClick={() => goTo(5)} next="Sources" />}
          </section>
        )}

        {/* Layer 5: the sources, compared */}
        {depth >= 5 && (
          <section ref={layer(5)} className="scroll-mt-28 pt-8">
            <LayerHead n={5} title="Sources" />
            <SourceTable story={story} />
          </section>
        )}

        <div className="mt-10">
          <Link to="/" className="press flex min-h-[48px] items-center justify-between border-2 border-ink px-4 text-ink">
            <span className="t-eyebrow">Back to today’s issue</span>
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-10 max-w-3xl px-6 sm:px-8">
          <div className="rule-strong pt-2.5">
            <h2 className="t-eyebrow text-ink">Related developments</h2>
          </div>
          <div className="mt-2 border-b border-rule">
            {related.map((s) => (
              <CompactRow key={s.id} story={s} thumb />
            ))}
          </div>
        </section>
      )}

      {sheet && <SignupSheet onClose={() => setSheet(false)} />}
    </article>
  )
}

function LayerHead({ n, title }: { n: number; title: string }) {
  return (
    <div className="rule-strong mb-4 flex items-baseline gap-3 pt-2.5">
      <span className="font-mono text-[12px] font-semibold text-ink">{String(n).padStart(2, '0')}</span>
      <h2 className="t-eyebrow text-ink">{title}</h2>
    </div>
  )
}

function Deeper({ onClick, next }: { onClick: () => void; next: string }) {
  return (
    <button onClick={onClick} className="press mt-7 flex min-h-[48px] w-full items-center justify-between bg-ink px-4 text-paper">
      <span className="t-eyebrow">Go deeper · {next}</span>
      <ArrowDown className="h-4 w-4" />
    </button>
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
      <p className="t-meta mb-3 text-ink-soft">
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
                  <span className="t-eyebrow shrink-0 text-ink-soft">{s.kind}</span>
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
