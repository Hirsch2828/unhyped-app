// The 5h story sections: Hype vs Reality, Why it matters (company / stock), What to watch next,
// Bull vs Bear, and the anatomy behind a button.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BellPlus, BellRing, X } from 'lucide-react'
import type { Story } from '../data/types'
import { usePrefs } from '../lib/prefs'
import StoryFigure, { useStoryFigure } from './anatomy/StoryFigure'

/* ---------- Hype vs Reality ---------- */

export function verdictOf(score: number) {
  return score >= 75 ? 'Solid' : score >= 50 ? 'Mostly real' : score >= 25 ? 'Shaky' : 'Mostly hype'
}

export function HypeMeter({ story }: { story: Story }) {
  const score = story.hypeScore
  if (score === null || score === undefined) return null
  return (
    <section aria-label="Hype vs Reality" className="border-y border-rule py-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="t-eyebrow text-ink">Hype vs Reality</h2>
        <p className="text-ink">
          <span className="text-[26px] font-bold tracking-[-0.03em]">{score}</span>
          <span className="t-meta text-ink-soft">/100 · </span>
          <span className="font-semibold">{verdictOf(score)}</span>
        </p>
      </div>
      <div
        className="relative mt-2 h-3 border border-ink"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score}
        aria-valuetext={`${score} out of 100, ${verdictOf(score)}`}
        aria-label="Hype vs Reality score"
      >
        <div className="halftone absolute inset-y-0 left-0 opacity-30" style={{ width: '100%' }} aria-hidden />
        <div className="absolute inset-y-0 left-0 bg-ink" style={{ width: `${score}%` }} />
        <div className="absolute -top-1 h-[18px] w-[6px] -translate-x-1/2 border border-ink bg-lime" style={{ left: `${score}%` }} aria-hidden />
      </div>
      <div className="t-meta mt-1.5 flex justify-between text-ink-soft" aria-hidden>
        <span>Hype</span>
        <span>Reality</span>
      </div>
      {story.hypeReason && <p className="mt-2 text-[15px] leading-[22px] text-ink">{story.hypeReason}</p>}
    </section>
  )
}

/** A small score tag for cards and lists. */
export function HypeTag({ story, className = '' }: { story: Pick<Story, 'hypeScore'>; className?: string }) {
  if (story.hypeScore === null || story.hypeScore === undefined) return null
  return (
    <span className={`t-tag inline-flex items-center gap-1 border border-ink px-1.5 py-0.5 text-ink ${className}`} title="Hype vs Reality score">
      Reality {story.hypeScore}
    </span>
  )
}

/* ---------- Why it matters ---------- */

export function WhyItMatters({ story }: { story: Story }) {
  const parts = [
    story.whyCompany && { title: 'For the company', text: story.whyCompany },
    story.whyStock && { title: 'For the stock', text: story.whyStock },
  ].filter(Boolean) as { title: string; text: string }[]
  return (
    <div className="bg-ink p-5 text-paper sm:p-7">
      <p className="text-[15px] font-bold text-lime">Why it matters</p>
      <p className="mt-2 text-[19px] leading-[28px] sm:text-[21px] sm:leading-[31px]">{story.whyItMatters}</p>
      {parts.length > 0 && (
        <div className={`mt-5 grid grid-cols-1 gap-5 border-t border-paper/25 pt-5 ${parts.length > 1 ? 'sm:grid-cols-2 sm:gap-7' : ''}`}>
          {parts.map((p) => (
            <div key={p.title}>
              <h3 className="t-eyebrow text-paper">{p.title}</h3>
              <p className="mt-1.5 text-[16.5px] leading-[25px] text-paper/90">{p.text}</p>
            </div>
          ))}
        </div>
      )}
      {story.whyStock && <p className="t-meta mt-4 text-paper/70">What happened, not advice. We never say buy or sell.</p>}
    </div>
  )
}

/** Section heading: the article style, or the sidebar style (a strong rule above). */
export const sideHead = (side: boolean) => (side ? 't-section rule-strong pt-3' : 't-section mt-10 sm:text-[26px] sm:leading-[30px]')

/* ---------- What to watch next ---------- */

const watchDate = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export function WatchNext({ story, side = false }: { story: Story; side?: boolean }) {
  const { prefs, update } = usePrefs()
  const items = story.watchNext ?? []
  if (!items.length) return null
  const isOn = (what: string) => prefs.reminders.some((r) => r.story === story.id && r.what === what)
  const toggle = (it: { when: string | null; what: string }) =>
    update({
      reminders: isOn(it.what)
        ? prefs.reminders.filter((r) => !(r.story === story.id && r.what === it.what))
        : [...prefs.reminders, { story: story.id, title: story.title, when: it.when, what: it.what }],
    })
  return (
    <section>
      <h2 className={sideHead(side)}>What to watch next</h2>
      <ul className="mt-3 border-b border-rule">
        {items.map((it) => {
          const on = isOn(it.what)
          return (
            <li key={it.what} className="flex items-start gap-4 border-t border-rule py-3.5">
              <span className="t-meta w-14 shrink-0 pt-1 font-semibold text-ink">{it.when ? watchDate(it.when) : 'Soon'}</span>
              <span className="min-w-0 flex-1 text-[17px] leading-[26px] text-ink">{it.what}</span>
              <button
                onClick={() => toggle(it)}
                aria-pressed={on}
                className={`press inline-flex min-h-[44px] shrink-0 items-center gap-1.5 px-2.5 text-[14px] font-semibold ${on ? 'bg-lime text-lime-ink' : 'text-ink-soft hover:text-ink'}`}
              >
                {on ? <BellRing className="h-4 w-4" /> : <BellPlus className="h-4 w-4" />}
                <span>{on ? 'Reminder set' : 'Remind me'}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="t-meta mt-2 text-ink-soft">Reminders live in this app for now. Email reminders come later.</p>
    </section>
  )
}

/* ---------- Bull vs Bear ---------- */

export function BullBear({ story, side = false }: { story: Story; side?: boolean }) {
  const bull = story.bull ?? []
  const bear = story.bear ?? []
  if (!bull.length && !bear.length) return null
  const column = (title: string, icon: string, list: { text: string; n: number }[], empty: string) => (
    <div className="border-t-2 border-ink pt-3">
      <h3 className="text-[17px] font-bold text-ink">
        <span aria-hidden className="mr-1.5">{icon}</span>
        {title}
      </h3>
      {list.length ? (
        <ul className="mt-2 space-y-3">
          {list.map((x) => (
            <li key={x.text} className="text-[16.5px] leading-[25px] text-ink">
              {x.text}
              <span className="t-meta ml-2 whitespace-nowrap text-ink-soft">· {x.n} {x.n === 1 ? 'source' : 'sources'}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[15px] text-ink-soft">{empty}</p>
      )}
    </div>
  )
  return (
    <section>
      <h2 className={sideHead(side)}>Bull vs Bear</h2>
      <p className="mt-1 text-[15px] text-ink-soft">The strongest point each way, only from the sources. Not a forecast.</p>
      <div className={`mt-4 grid grid-cols-1 gap-6 ${side ? '' : 'sm:grid-cols-2'}`}>
        {column('The bull case', '🐂', bull, 'The sources make no case for good news.')}
        {column('The bear case', '🐻', bear, 'The sources name no risk.')}
      </div>
    </section>
  )
}

/* ---------- The anatomy, behind a button ---------- */

export function AnatomyButton({ story }: { story: Story }) {
  const { company, eventName } = useStoryFigure(story)
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null)
  const name = company ? `Take ${company.name} apart` : `See the ${eventName.toLowerCase()} as a machine`
  return (
    <>
      <button
        ref={btn}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="press t-meta inline-flex min-h-[40px] items-center bg-lime px-3 font-semibold text-lime-ink"
      >
        {name} →
      </button>
      {open && (
        <AnatomyDialog
          title={company ? `${company.name}, taken apart` : `${eventName}, as a machine`}
          onClose={() => {
            setOpen(false)
            btn.current?.focus()
          }}
        >
          <StoryFigure story={story} size="full" auto />
        </AnatomyDialog>
      )}
    </>
  )
}

function AnatomyDialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const close = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    close.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      // keep Tab inside the dialog
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])
  // Rendered into <body>: the page's fade-in animation would otherwise trap it under the bottom bar.
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 sm:items-center sm:p-6" onClick={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="fade-in max-h-[88vh] w-full max-w-[760px] overflow-y-auto border-t-2 border-ink bg-paper p-4 sm:border-2 sm:p-6"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
          <button ref={close} onClick={onClose} className="press grid h-11 w-11 place-items-center text-ink" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
