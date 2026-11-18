import { Link } from 'react-router-dom'
import CompanyFigure from '../components/anatomy/CompanyFigure'
import ExplodedFigure from '../components/anatomy/ExplodedFigure'
import { objectFor } from '../components/anatomy/objects'
import { COMPANIES } from '../data/companies'
import { pickFigure } from '../lib/figure'
import { useStories } from '../lib/stories'

// Every company we've taken apart, with how many of this week's stories are about it.
export default function Companies() {
  const { stories } = useStories()
  const count = (id: string) => stories.filter((s) => { const p = pickFigure(s); return p.kind === 'company' && p.company.id === id }).length
  const list = [...COMPANIES].sort((a, b) => count(b.id) - count(a.id))
  return (
    <div className="fade-in px-4 pt-8 sm:px-8 sm:pt-12">
      <p className="t-meta uppercase text-ink-soft">Company teardowns</p>
      <h1 className="t-display mt-3 max-w-4xl">
        {COMPANIES.length} companies, <span className="mark">taken apart</span>.
      </h1>
      <p className="mt-4 max-w-2xl text-[18px] leading-[27px] text-ink-soft">What each company actually sells, drawn as one object or one machine. Every story about them lights up the part it is about.</p>
      <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => {
          const n = count(c.id)
          return (
            <Link key={c.id} to={`/company/${c.id}`} className="press group block">
              <span className="anatomy block border border-rule bg-paper">
                {c.form === 'machine' ? <CompanyFigure company={c} scroll /> : <ExplodedFigure obj={objectFor(c.form)!} label={`${c.name}, taken apart`} />}
              </span>
              <span className="mt-3 flex items-baseline justify-between gap-3">
                <span className="text-[24px] font-black tracking-[-0.025em] group-hover:underline">{c.name}</span>
                <span className="t-meta text-ink-soft">{c.parts.length} parts{n ? ` · ${n} ${n === 1 ? 'story' : 'stories'}` : ''}</span>
              </span>
              <span className="mt-1 block text-[16px] leading-[24px] text-ink-soft">{c.line}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
