import { useEffect, useMemo, useRef } from 'react'
import '../iso/iso.css'
import * as F from './press'
import type { StationId } from './press'

const html = (s: string) => ({ __html: s })

// Card positions along the track for one loop (seconds → x), with the press, stamp and gate pauses.
const LOOP = 11
function cardAt(t: number) {
  const T = F.TRACK_X
  const legs: [number, number, number, number][] = [
    // t0, t1, x0, x1
    [0, 1.4, T.start, T.press],
    [1.4, 3.0, T.press, T.press], // pressed
    [3.0, 4.0, T.press, T.stamp[1]],
    [4.0, 5.4, T.stamp[1], T.stamp[1]], // stamped
    [5.4, 6.2, T.stamp[1], T.gate],
    [6.2, 7.8, T.gate, T.gate], // held for review
    [7.8, 9.2, T.gate, T.tray],
    [9.2, LOOP, T.tray, T.tray],
  ]
  for (const [t0, t1, x0, x1] of legs) if (t >= t0 && t < t1) return x0 + (x1 - x0) * ease((t - t0) / (t1 - t0))
  return T.tray
}
const ease = (k: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), 3)
const pulse = (t: number, t0: number, t1: number) => (t < t0 || t > t1 ? 0 : Math.sin(((t - t0) / (t1 - t0)) * Math.PI))

export default function PressFigure({
  selected,
  onSelect,
  tiers,
  issueSize,
  stampIndex,
  issueNo,
}: {
  selected: StationId | null
  onSelect: (id: StationId | null) => void
  tiers: F.Tiers
  issueSize: number
  stampIndex: number
  issueNo: number
}) {
  const card = useRef<SVGGElement>(null)
  const platen = useRef<SVGGElement>(null)
  const stampRef = useRef<SVGGElement>(null)
  const armRef = useRef<SVGGElement>(null)
  const lampRef = useRef<SVGGElement>(null)
  const stackRef = useRef<SVGGElement>(null)
  const root = useRef<SVGSVGElement>(null)
  const needleRef = useRef<SVGGElement>(null)

  const srcs = useMemo(() => F.sources(tiers, selected === 'sources'), [tiers, selected])
  const stackArt = useMemo(() => F.stack(selected === 'dedup'), [selected])
  const trayArt = useMemo(() => F.tray(Math.max(1, Math.min(8, issueSize)), selected === 'issue', issueNo), [issueSize, selected, issueNo])
  const stamps = useMemo(() => [0, 1, 2].map((i) => F.stamp(i, i === stampIndex && selected === 'label')), [stampIndex, selected])

  // The idle tour: a card rides the bench, gets pressed, stamped, checked and filed. Stops offscreen and
  // under reduced motion (the still frame shows the card under the stamp).
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const apply = (t: number) => {
      const x = cardAt(t)
      card.current?.setAttribute('transform', F.moveBy([x, 0, 0]))
      card.current?.setAttribute('opacity', String(t > 9.6 ? Math.max(0, 1 - (t - 9.6) / 0.6) : t < 0.3 ? t / 0.3 : 1))
      platen.current?.setAttribute('transform', F.moveBy([0, 0, -F.PLATEN_TRAVEL * pulse(t, 1.4, 3.0)]))
      stackRef.current?.setAttribute('opacity', String(t < 1.4 ? 1 : t < 2.2 ? 1 - (t - 1.4) / 0.8 : t > 10.4 ? (t - 10.4) / 0.6 : 0))
      stampRef.current?.setAttribute('transform', F.moveBy([0, 0, -F.STAMP_TRAVEL * pulse(t, 4.0, 5.4)]))
      armRef.current?.setAttribute('transform', F.moveBy([0, 0, F.GATE_LIFT * ease((t - 7.2) / 0.5) * (t < 8.6 ? 1 : Math.max(0, 1 - (t - 8.6) / 0.6))]))
      lampRef.current?.setAttribute('data-on', t > 6.2 && t < 7.8 ? '1' : '0')
      // the gauge counts the seven slips as the platen comes down, and resets when the next stack arrives
      const k = t < 1.4 ? 0 : t < 2.4 ? (t - 1.4) / 1.0 : t < 10.4 ? 1 : 1 - (t - 10.4) / 0.6
      if (needleRef.current) needleRef.current.innerHTML = F.needle(Math.max(0, Math.min(1, k)) * 0.7)
    }
    if (reduce) {
      apply(4.7)
      return
    }
    let raf = 0
    let start = performance.now()
    let visible = true
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      if (visible) {
        start = performance.now() - ((performance.now() - start) % (LOOP * 1000))
        raf = requestAnimationFrame(tick)
      }
    })
    const tick = (now: number) => {
      if (!visible) return
      apply(((now - start) / 1000) % LOOP)
      raf = requestAnimationFrame(tick)
    }
    if (root.current) io.observe(root.current)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [])

  // Zoom toward the selected station (an eased SVG transform); the others step back.
  const zoomRef = useRef<SVGGElement>(null)
  const hitsRef = useRef<SVGGElement>(null)
  const view = useRef({ tx: 0, ty: 0, s: 1 })
  useEffect(() => {
    let target = { tx: 0, ty: 0, s: 1 }
    if (selected) {
      const b = F.stationBox(selected)
      const s = Math.min(2.4, (F.W * 0.9) / b.w, (F.H * 0.9) / b.h)
      target = { s, tx: F.W / 2 - (b.x + b.w / 2) * s, ty: F.H / 2 - (b.y + b.h / 2) * s }
    }
    const set = (v: typeof target) => {
      const t = `translate(${v.tx.toFixed(2)} ${v.ty.toFixed(2)}) scale(${v.s.toFixed(4)})`
      zoomRef.current?.setAttribute('transform', t)
      hitsRef.current?.setAttribute('transform', t)
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
  }, [selected])

  const dim = (id: StationId) => (selected && selected !== id ? 'press-dim' : '')

  return (
    <svg ref={root} viewBox={`0 0 ${F.W} ${F.H}`} className="iso-svg press overflow-hidden" role="img" aria-label="An illustrated bench machine showing how Unhyped works: a rack of sources, a press that merges duplicate articles into one story, a stamp that labels it, a gate where a person reviews it, and a tray that collects today's issue.">
      <g ref={zoomRef}>
        <g dangerouslySetInnerHTML={html(F.statics.base + F.statics.track)} />
        <g className={dim('sources')} dangerouslySetInnerHTML={html(srcs)} />
        <g className={dim('dedup')}>
          <g dangerouslySetInnerHTML={html(F.statics.pressFrame.back)} />
          <g ref={stackRef} dangerouslySetInnerHTML={html(stackArt)} />
        </g>
        <g className={dim('label')} dangerouslySetInnerHTML={html(F.statics.bridge)} />
        <g className={dim('review')} dangerouslySetInnerHTML={html(F.statics.gateBack)} />
        <g className={dim('issue')} dangerouslySetInnerHTML={html(trayArt)} />
        <g ref={card} className={selected ? 'press-dim-soft' : ''} dangerouslySetInnerHTML={html(F.card())} />
        <g className={dim('dedup')}>
          <g ref={platen} dangerouslySetInnerHTML={html(F.platen())} />
          <g dangerouslySetInnerHTML={html(F.statics.pressFrame.front + F.dialFace() + F.statics.pressTop)} />
          <g ref={needleRef} />
        </g>
        <g className={dim('label')}>
          {stamps.map((s, i) => (
            <g key={i} ref={i === stampIndex ? stampRef : undefined} dangerouslySetInnerHTML={html(s)} />
          ))}
        </g>
        <g className={dim('review')}>
          <g dangerouslySetInnerHTML={html(F.loupe(selected === 'review') + F.statics.gatePost)} />
          <g ref={armRef} dangerouslySetInnerHTML={html(F.statics.arm)} />
          <g dangerouslySetInnerHTML={html(F.lamp(false))} />
          <g ref={lampRef} className="press-lamp" dangerouslySetInnerHTML={html(F.lamp(true))} />
        </g>
      </g>
      {/* Hit areas: one per station (keyboard users get the buttons under the figure). */}
      <g ref={hitsRef} className="press-hits">
        {F.STATIONS.map((id) => (
          <polygon
            key={id}
            points={F.hitPolygon(id)}
            onClick={() => onSelect(selected === id ? null : id)}
            aria-hidden
          />
        ))}
      </g>
    </svg>
  )
}
