import { useEffect, useRef } from 'react'
import '../iso/iso.css'
import { scrollProgress, type Exploded } from './exploded'

const html = (s: string) => ({ __html: s })
const clamp = (v: number) => Math.min(1, Math.max(0, v))
const ease = (k: number) => k * k * (3 - 2 * k)


// The object comes apart as it scrolls up the screen, like a scroll-scrubbed teardown film. A tapped part lifts it
// fully apart and dims the rest. Under reduced motion it stays fully apart and still.
export default function ExplodedFigure({
  obj,
  label,
  selected = null,
  onSelect,
  still,
  lit = null,
  className = '',
}: {
  obj: Exploded
  label: string
  selected?: number | null
  onSelect?: (i: number | null) => void
  /** a fixed explode amount (0 assembled, 1 apart) instead of following the scroll */
  still?: number
  /** a part drawn lit without dimming the others (the part a headline names) */
  lit?: number | null
  className?: string
}) {
  const root = useRef<SVGSVGElement>(null)
  const groups = useRef<(SVGGElement | null)[]>([])
  const hits = useRef<(SVGGElement | null)[]>([])
  const cam = useRef<SVGGElement>(null)
  const sel = useRef(selected)
  sel.current = selected

  useEffect(() => {
    const set = (t: number) => {
      // pull the camera back as the object comes apart
      const { s: s0, tx, ty } = obj.near
      const k = ease(clamp(t / 0.6))
      const sc = s0 + (1 - s0) * k
      // number tags appear once the parts have room
      cam.current?.querySelectorAll<SVGGElement>('.iso-tag-group').forEach((g) => g.setAttribute('opacity', clamp((t - 0.35) / 0.35).toFixed(2)))
      cam.current?.setAttribute('transform', `translate(${(tx * (1 - k)).toFixed(2)} ${(ty * (1 - k)).toFixed(2)}) scale(${sc.toFixed(4)})`)
      obj.layers.forEach((l, i) => {
        const [a, b] = l.span ?? [0, 1]
        const k = ease(clamp((t - a) / (b - a)))
        const tr = obj.moveBy([l.to[0] * k, l.to[1] * k, l.to[2] * k])
        groups.current[i]?.setAttribute('transform', tr)
        hits.current[i]?.setAttribute('transform', tr)
      })
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (still !== undefined || reduced) return set(still ?? 1)
    let t = root.current ? scrollProgress(root.current) : 0
    set(t)
    let raf = 0
    let visible = true
    const tick = () => {
      if (!visible || !root.current) return
      const target = sel.current !== null && sel.current !== undefined ? 1 : scrollProgress(root.current)
      // ease toward the target so the scrub feels like film, not a jump
      t += (target - t) * 0.14
      if (Math.abs(target - t) < 0.0005) t = target
      set(t)
      raf = requestAnimationFrame(tick)
    }
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      cancelAnimationFrame(raf)
      if (visible) raf = requestAnimationFrame(tick)
    })
    if (root.current) io.observe(root.current)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [obj, still])

  // Layer index → part index. A "follow" layer (like the near wheels) belongs to the part it moves with.
  const partOf: number[] = []
  let n = 0
  for (const l of obj.layers) partOf.push(l.follow ? partOf[obj.layers.findIndex((o) => o.id === l.follow)] : n++)
  const on = (p: number) => selected === p || (selected === null && lit === p)
  const dim = (p: number) => (selected !== null && selected !== p ? 'press-dim' : '')
  return (
    <svg ref={root} viewBox={`0 0 ${obj.w} ${obj.h}`} className={`iso-svg press ${className}`} role="img" aria-label={label}>
      <g ref={cam}>
      <g dangerouslySetInnerHTML={html(obj.floor)} />
      {obj.layers.map((l, i) => (
        <g key={l.id} ref={(el) => { groups.current[i] = el }} className={dim(partOf[i])}>
          <g dangerouslySetInnerHTML={html(l.svg(on(partOf[i])))} />
          {obj.tags && !l.follow && <g className="iso-tag-group" aria-hidden>
            <path className="iso-line" data-tone={on(partOf[i]) ? 'hi' : 'lo'} d={`M${(l.tag[0] + 6).toFixed(1)} ${l.tag[1].toFixed(1)}H${(l.tag[0] + 30).toFixed(1)}`} />
            {on(partOf[i]) && <rect x={l.tag[0] + 32} y={l.tag[1] - 7} width={18} height={13} className="iso-tag-lit" />}
            <text x={l.tag[0] + 34} y={l.tag[1] + 3.5} className="iso-tag">
              {String(partOf[i] + 1).padStart(2, '0')}
            </text>
          </g>}
        </g>
      ))}
      {onSelect && (
        <g className="press-hits">
          {obj.layers.map((l, i) =>
            l.follow ? null : (
              <g key={l.id} ref={(el) => { hits.current[i] = el }}>
                <polygon points={l.hit} onClick={() => onSelect(selected === partOf[i] ? null : partOf[i])} aria-hidden />
              </g>
            ),
          )}
        </g>
      )}
      </g>
    </svg>
  )
}
