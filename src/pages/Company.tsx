import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import CompanyFigure from '../components/anatomy/CompanyFigure'
import ExplodedFigure from '../components/anatomy/ExplodedFigure'
import { objectFor } from '../components/anatomy/objects'
import { companyById, type Company as CompanyT } from '../data/companies'
import { CompactRow } from '../components/ui'
import { pickFigure } from '../lib/figure'
import { useStories } from '../lib/stories'

// A company taken apart: its product as an exploded object, or its services as a machine, plus the latest stories
// about it, each marked with the part it is about.

export default function Company() {
  const { id = '' } = useParams()
  const c = companyById(id)
  const [params, setParams] = useSearchParams()
  const raw = params.get('part')
  const sel = c ? c.parts.findIndex((p) => p.id === raw) : -1
  const selected = sel >= 0 ? sel : null
  const select = (i: number | null) => setParams(i === null || !c ? {} : { part: c.parts[i].id }, { replace: true })
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!c) return
      if (e.key === 'Escape') select(null)
      if (e.key === 'ArrowRight') select(selected === null ? 0 : (selected + 1) % c.parts.length)
      if (e.key === 'ArrowLeft') select(selected === null ? c.parts.length - 1 : (selected - 1 + c.parts.length) % c.parts.length)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })

  if (!c)
    return (
      <div className="px-4 pt-14 sm:px-8">
        <p className="t-meta uppercase text-ink-soft">Not taken apart yet</p>
        <h1 className="t-h1 mt-3 max-w-3xl">We haven’t taken <span className="mark">this company</span> apart yet.</h1>
        <Link to="/companies" className="press mt-6 inline-flex min-h-[48px] items-center bg-ink px-6 text-[15px] font-semibold text-paper">See every company</Link>
      </div>
    )
  const part = selected !== null ? c.parts[selected] : null
  return (
    <div className="fade-in px-4 pb-8 pt-8 sm:px-8 sm:pt-12">
      <Link to="/companies" className="t-meta inline-flex min-h-[44px] items-center text-ink-soft hover:text-ink">← All companies</Link>
        <p className="font-mono mt-2 block w-fit bg-lime px-2 py-1 text-[12px] font-medium tracking-[0.12em] text-lime-ink">TAKE {c.name.toUpperCase()} APART</p>
        <h1 className="mt-3 max-w-4xl text-[44px] font-black leading-[0.95] tracking-[-0.03em] sm:text-[84px]">
          {c.name}, in <mark className="bg-lime px-1 text-lime-ink [box-decoration-break:clone]">{c.parts.length} parts</mark>.
        </h1>
        <p className="mt-5 max-w-2xl text-[18px] leading-[28px] text-ink-soft sm:text-[20px] sm:leading-[30px]">{c.line} {c.form === 'machine' ? `Follow ${c.unit} through the machine.` : `Scroll to take ${c.unit} apart.`}</p>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <figure className="anatomy relative self-start border border-rule bg-paper px-0 pb-10 pt-10 sm:px-4 lg:col-span-8">
            <span className="font-mono absolute left-3 top-3 text-[11px] text-ink">Fig. {c.name}</span>
            <span className="font-mono absolute right-3 top-3 text-[11px] uppercase text-ink-soft">{selected !== null ? `${String(selected + 1).padStart(2, '0')} / ${String(c.parts.length).padStart(2, '0')}` : 'All parts'}</span>
            {c.form === 'machine' ? (
              <CompanyFigure company={c} selected={selected} onSelect={select} />
            ) : (
              <ExplodedFigure obj={objectFor(c.form)!} label={`${c.name}'s ${c.unit}, taken apart into ${c.parts.length} layers: ${c.parts.map((p) => p.name).join(', ')}.`} selected={selected} onSelect={select} />
            )}
            <span className="font-mono absolute bottom-3 left-3 hidden text-[11px] uppercase text-ink-soft sm:block">{selected !== null ? 'Esc · all parts   ← → · next' : 'Tap a part'}</span>
            <span className="font-mono absolute bottom-3 right-3 bg-lime px-1.5 text-[11px] text-lime-ink" aria-live="polite">{part ? part.name : `${c.parts.length} parts`}</span>
          </figure>

          <div className="lg:col-span-4">
            <div role="tablist" aria-label={`Parts of ${c.name}`} className="flex flex-wrap gap-2 lg:flex-col lg:gap-0">
              {c.parts.map((p, i) => (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={selected === i}
                  onClick={() => select(selected === i ? null : i)}
                  className={`flex min-h-[44px] items-center gap-3 border px-3 text-left transition-colors lg:border-x-0 lg:border-b-0 lg:border-t lg:px-0 ${selected === i ? 'border-ink text-ink lg:border-rule' : 'border-rule text-ink-soft hover:text-ink hover:underline'}`}
                >
                  <span className={`font-mono px-1 text-[11px] ${selected === i ? 'bg-lime text-lime-ink' : ''}`}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[15px] font-extrabold lg:text-[17px]">{p.name}</span>
                </button>
              ))}
            </div>
            <section role="tabpanel" aria-live="polite" className="mt-6 border-t-2 border-ink pt-4">
              {part ? (
                <>
                  <h2 className="text-[26px] font-black leading-[30px] tracking-[-0.02em]">{part.name}</h2>
                  <p className="mt-3 text-[17px] leading-[26px] text-ink">{part.role}</p>
                  <p className="mt-3 text-[15.5px] leading-[24px] text-ink-soft">{part.what}</p>
                </>
              ) : (
                <>
                  <h2 className="text-[26px] font-black leading-[30px] tracking-[-0.02em]">What {c.name} sells</h2>
                  <p className="mt-3 text-[17px] leading-[26px] text-ink-soft">{c.parts.map((p) => p.name).join(' · ')}. Tap a part to see what it does.</p>
                </>
              )}
              <div className="font-mono mt-6 flex items-center justify-between border-t border-rule pt-2 text-[12px]">
                <button className="min-h-[44px] text-ink-soft hover:text-ink hover:underline" onClick={() => select(selected === null ? c.parts.length - 1 : (selected - 1 + c.parts.length) % c.parts.length)}>← PREV</button>
                <button className="min-h-[44px] text-ink-soft hover:text-ink hover:underline disabled:opacity-40" disabled={selected === null} onClick={() => select(null)}>ALL PARTS</button>
                <button className="min-h-[44px] text-ink" onClick={() => select(selected === null ? 0 : (selected + 1) % c.parts.length)}>NEXT →</button>
              </div>
              <p className="font-mono mt-6 text-[11px] leading-[17px] text-ink-soft">
                Source: <a className="underline hover:text-ink hover:underline" href={c.source.url} target="_blank" rel="noreferrer">{c.source.label}</a>
              </p>
            </section>
          </div>
        </div>
      <Recent company={c} />
    </div>
  )
}

function Recent({ company }: { company: CompanyT }) {
  const { stories } = useStories()
  const mine = stories.filter((s) => {
    const p = pickFigure(s)
    return p.kind === 'company' && p.company.id === company.id
  })
  return (
    <section className="mt-14">
      <h2 className="t-section rule-strong pt-3">The latest on {company.name}</h2>
      <p className="mt-1 text-[15px] text-ink-soft">{mine.length ? 'Each story lights up the part it is about.' : `No stories about ${company.name} this week.`}</p>
      {mine.length > 0 && (
        <div className="mt-2 border-b border-rule lg:max-w-[66%]">
          {mine.slice(0, 8).map((s) => (
            <CompactRow key={s.id} story={s} thumb />
          ))}
        </div>
      )}
    </section>
  )
}
