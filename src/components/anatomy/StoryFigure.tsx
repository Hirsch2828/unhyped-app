import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Story } from '../../data/types'
import { pickFigure } from '../../lib/figure'
import CompanyFigure from './CompanyFigure'
import ExplodedFigure from './ExplodedFigure'
import { objectFor } from './objects'
import { eventScene } from './objects/events'

const EVENT_NAME = { earnings: 'Earnings', regulation: 'Rules', launch: 'Launch', probe: 'Investigation', leadership: 'Leadership', deal: 'Deal' } as const

/** The anatomy figure for one story: its company taken apart (the named part lit), or the scene of its event. */
export function useStoryFigure(story: Pick<Story, 'title' | 'dek' | 'highlight'>) {
  return useMemo(() => {
    const pick = pickFigure(story)
    const obj = pick.kind === 'company' && pick.company.form !== 'machine' ? objectFor(pick.company.form) : null
    // A company whose object isn't built yet falls back to its event scene.
    const company = pick.kind === 'company' && (pick.company.form === 'machine' || obj) ? pick.company : null
    return { pick, company, obj, scene: eventScene(pick.event), eventName: EVENT_NAME[pick.event] }
  }, [story.title, story.dek, story.highlight]) // eslint-disable-line react-hooks/exhaustive-deps
}

export default function StoryFigure({ story, size = 'thumb', className = '', tag = false }: { story: Pick<Story, 'title' | 'dek' | 'highlight'>; size?: 'thumb' | 'full'; className?: string; tag?: boolean }) {
  const { pick, company, obj, scene, eventName } = useStoryFigure(story)
  const part = pick.kind === 'company' ? pick.part : null
  const label = company ? `${company.name}${part !== null ? `: ${company.parts[part].name}` : ''}, drawn as ${company.form === 'machine' ? 'a machine' : 'its product taken apart'}.` : `${eventName}, drawn as a small machine.`
  const fig = company ? (
    company.form === 'machine' ? (
      <CompanyFigure company={company} lit={part} scroll />
    ) : (
      <ExplodedFigure obj={obj!} label={label} lit={part} />
    )
  ) : (
    <ExplodedFigure obj={scene} label={label} />
  )
  if (size === 'thumb')
    return (
      <span className={`anatomy relative block overflow-hidden border border-rule bg-paper ${className}`} aria-hidden>
        {fig}
        {tag && <span className="t-tag absolute bottom-1.5 left-1.5 hidden bg-paper px-1 text-ink-soft lg:block">{company ? (part !== null ? company.parts[part].name : company.name) : eventName}</span>}
      </span>
    )
  const main = (
    <figure className={`anatomy relative border border-rule bg-paper ${company && part === null ? '' : className}`}>
      <span className="t-meta absolute left-3 top-3 text-ink">Fig. {company ? company.name : eventName}</span>
      <div className="px-2 pt-10 sm:pb-12">{fig}</div>
      <figcaption className="flex flex-col items-start gap-2 px-3 pb-3 sm:absolute sm:inset-x-3 sm:bottom-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-0">
        <span className="t-meta text-ink-soft">{company ? (part !== null ? company.parts[part].role : company.line) : 'Scroll to watch it happen.'}</span>
        {company && (
          <Link to={`/company/${company.id}${part !== null ? `?part=${company.parts[part].id}` : ''}`} className="press t-meta inline-flex min-h-[40px] shrink-0 items-center bg-lime px-3 font-semibold text-lime-ink">
            Take {company.name} apart →
          </Link>
        )}
      </figcaption>
    </figure>
  )
  // A company story that names no product: the company, and beside it what happened.
  if (!company || part !== null) return main
  return (
    <div className={`grid grid-cols-1 gap-3 ${className}`}>
      {main}
      <figure className="anatomy relative grid grid-cols-[1fr_1.4fr] items-center gap-3 border border-rule bg-paper p-3">
        <figcaption>
          <span className="t-tag text-ink-soft">What happened</span>
          <span className="mt-1 block text-[20px] font-extrabold leading-[24px] tracking-[-0.02em]">{eventName}</span>
        </figcaption>
        <ExplodedFigure obj={scene} label={`${eventName}, drawn as a small machine.`} />
      </figure>
    </div>
  )
}
