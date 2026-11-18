import { useEffect, useMemo, useRef } from 'react'
import '../iso/iso.css'
import type { Company } from '../../data/companies'
import { buildMachine, W, H } from './company'
import { scrollProgress } from './exploded'

const html = (s: string) => ({ __html: s })
const ease = (k: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3)

// A crate rides the bench, pausing under each station; tapping a station zooms to it and dims the others.
export default function CompanyFigure({
  company,
  selected = null,
  onSelect,
  lit = null,
  scroll = false,
}: {
  company: Company
  selected?: number | null
  onSelect?: (i: number | null) => void
  /** a station drawn lit without dimming the rest (the product a headline names) */
  lit?: number | null
  /** drive the crate with the page scroll instead of the idle tour: it rides to the lit station, or to the end */
  scroll?: boolean
}) {
  const m = useMemo(() => buildMachine(company), [company])
  const crate = useRef<SVGGElement>(null)
  const root = useRef<SVGSVGElement>(null)
  const zoom = useRef<SVGGElement>(null)
  const hits = useRef<SVGGElement>(null)
  const view = useRef({ tx: 0, ty: 0, s: 1 })

  // Idle tour: 1.2 s travel + 1 s pause per station. Paused offscreen; a still frame under reduced motion.
  useEffect(() => {
    const legs: [number, number, number, number][] = []
    let t = 0
    let x = m.startX
    for (const s of m.stops) {
      legs.push([t, t + 1.2, x, s], [t + 1.2, t + 2.2, s, s])
      t += 2.2
      x = s
    }
    legs.push([t, t + 1.2, x, m.endX])
    const loop = t + 2
    const at = (u: number) => {
      for (const [a, b, x0, x1] of legs) if (u >= a && u < b) return x0 + (x1 - x0) * ease((u - a) / (b - a))
      return m.endX
    }
    const apply = (u: number) => {
      crate.current?.setAttribute('transform', m.moveBy([at(u), 0, 0]))
      crate.current?.setAttribute('opacity', String(u > loop - 1 ? Math.max(0, loop - u) : u < 0.3 ? u / 0.3 : 1))
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return apply(2.2 + 0.6)
    if (scroll) {
      const goal = lit !== null ? m.stops[lit] : m.endX
      let k = 0
      let raf = 0
      let on = true
      const step = () => {
        if (!on || !root.current) return
        k += (scrollProgress(root.current) - k) * 0.14
        crate.current?.setAttribute('transform', m.moveBy([m.startX + (goal - m.startX) * ease(k), 0, 0]))
        crate.current?.setAttribute('opacity', '1')
        raf = requestAnimationFrame(step)
      }
      const io = new IntersectionObserver(([e]) => {
        on = e.isIntersecting
        cancelAnimationFrame(raf)
        if (on) raf = requestAnimationFrame(step)
      })
      if (root.current) io.observe(root.current)
      return () => {
        cancelAnimationFrame(raf)
        io.disconnect()
      }
    }
    let raf = 0
    let start = performance.now()
    let visible = true
    const tick = (now: number) => {
      if (!visible) return
      apply(((now - start) / 1000) % loop)
      raf = requestAnimationFrame(tick)
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) {
        start = performance.now() - ((performance.now() - start) % (loop * 1000))
        raf = requestAnimationFrame(tick)
      }
    })
    if (root.current) io.observe(root.current)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [m, scroll, lit])

  useEffect(() => {
    let target = { tx: 0, ty: 0, s: 1 }
    if (selected !== null) {
      const b = m.box(selected)
      const s = Math.min(2.6, (W * 0.92) / b.w, (H * 0.92) / b.h)
      target = { s, tx: W / 2 - (b.x + b.w / 2) * s, ty: H / 2 - (b.y + b.h / 2) * s }
    }
    const set = (v: typeof target) => {
      const tr = `translate(${v.tx.toFixed(2)} ${v.ty.toFixed(2)}) scale(${v.s.toFixed(4)})`
      zoom.current?.setAttribute('transform', tr)
      hits.current?.setAttribute('transform', tr)
      view.current = v
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return set(target)
    const from = { ...view.current }
    const t0 = performance.now()
    let raf = 0
    const step = (now: number) => {
      const k = ease((now - t0) / 650)
      set({ tx: from.tx + (target.tx - from.tx) * k, ty: from.ty + (target.ty - from.ty) * k, s: from.s + (target.s - from.s) * k })
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [selected, m])

  const dim = (i: number) => (selected !== null && selected !== i ? 'press-dim' : '')
  return (
    <svg ref={root} viewBox={`0 0 ${W} ${H}`} className="iso-svg press overflow-hidden" role="img" aria-label={`${company.name} drawn as one machine: ${company.parts.map((p) => p.name).join(', ')}.`}>
      <g ref={zoom}>
        <g dangerouslySetInnerHTML={html(m.base)} />
        {m.stations.map((s, i) => (
          <g key={s.id + 'b'} className={dim(i)} dangerouslySetInnerHTML={html(s.back(selected === i || (selected === null && lit === i)))} />
        ))}
        <g ref={crate} className={selected !== null ? 'press-dim-soft' : ''} dangerouslySetInnerHTML={html(m.crate)} />
        {m.stations.map((s, i) => (
          <g key={s.id + 'f'} className={dim(i)} dangerouslySetInnerHTML={html(s.front(selected === i || (selected === null && lit === i)))} />
        ))}
      </g>
      {onSelect && <g ref={hits} className="press-hits">
        {m.stations.map((s, i) => (
          <polygon key={s.id} points={m.hit(i)} onClick={() => onSelect(selected === i ? null : i)} aria-hidden />
        ))}
      </g>}
    </svg>
  )
}
