// An exploded object: a physical product built as a stack of layers that lift apart (scroll, tap or a still frame).
// Each object module returns its layers drawn once at rest; the figure only moves whole layer groups along z.
import * as K from '../iso/iso-kit'
import type { Plan, Point3, Projection, SolidPaths } from '../iso/iso-kit'

export const W = 760
export const H = 460

export interface LayerSpec {
  id: string
  /** footprint used for the hit area and the tag */
  plan: Plan
  /** z of the layer's bottom and top at rest */
  z0: number
  top: number
  /** extra height at full explode */
  lift: number
  /** a move in any direction at full explode, used instead of `lift` by event scenes */
  move?: Point3
  /** the part of the scroll (0 to 1) over which this layer moves */
  span?: [number, number]
  /** not a part of its own: drawn here in paint order but moving with that layer (e.g. the near wheels) */
  follow?: string
}

export interface Layer extends LayerSpec {
  svg: (lit: boolean) => string
  hit: string
  /** screen point where this layer's number tag starts */
  tag: K.Flat
  /** the full move at t = 1 */
  to: Point3
}

export interface Exploded {
  P: Projection
  /** a soft floor shadow under the object */
  floor: string
  layers: Layer[]
  moveBy: (d: Point3) => string
  /** number tags beside each layer (objects), or none (event scenes) */
  tags: boolean
  w: number
  h: number
  /** the camera at rest: assembled objects are shown closer, and the view pulls back as they come apart */
  near: { s: number; tx: number; ty: number }
}

/** Drawing helpers bound to one projection, shared by every object module. */
export function tools(P: Projection) {
  const solid = (paths: SolidPaths, o: K.SolidStyle = {}) => K.solidSvg(paths, o)
  const slab = (plan: Plan, z: number, h: number, steps = 3, bevel = 0) => K.slabOf(plan, z, h, P, steps, bevel)
  const cyl = (cx: number, cy: number, r: number, z: number, h: number, steps = 20, bevel = 0) => K.cylinder(cx, cy, r, z, h, P, steps, bevel)
  const line = (d: string, tone: K.LineTone = 'lo', o: Partial<K.LineStyle> = {}) => K.lineSvg(d, { tone, ...o })
  const dots = (pts: Point3[], size = 0.55, tone: K.Tone = 'mid') => K.dotsSvg(K.pointsAt(pts, P), { size, tone })
  const top = (a: K.Plane, b: K.Plane, z: number) => K.lineOnTop(a, b, z, P)
  const text = (at: K.Plane, z: number, s: string, size = 5, tone: K.Tone = 'mid', along: 'x' | 'y' = 'x') => K.faceTextSvg(K.topMatrix(at, z, P, along), s, { size, tone })
  /** A prism along y: a side profile in (x, z) pushed from y0 to y1, for wheels and car bodies.
   *  The near cap is the bright face (it takes the lit colour); side faces are shaded by how they face the light. */
  const prismY = (profile: [number, number][], y0: number, y1: number): SolidPaths => {
    const cam = K.cameraOf(P)
    const view: Point3 = [cam.cosA * cam.cosE, cam.sinA * cam.cosE, cam.sinE]
    const n = profile.length
    const area = profile.reduce((a, [x, z], i) => { const [x2, z2] = profile[(i + 1) % n]; return a + x * z2 - x2 * z }, 0)
    const near = profile.map(([x, z]) => K.iso([x, y1, z], P))
    const far = profile.map(([x, z]) => K.iso([x, y0, z], P))
    const orient = (pts: K.Flat[]) => {
      const a = pts.reduce((acc, [x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return acc + x * y2 - x2 * y }, 0)
      return a < 0 ? [...pts].reverse() : pts
    }
    const buckets: string[][] = [[], [], [], []]
    const fill = [K.pathOf(orient(near), true), K.pathOf(orient(far), true)]
    const outline = [K.pathOf(near, true)]
    const crease: string[] = []
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const [ax, az] = profile[i]
      const [bx, bz] = profile[j]
      const len = Math.hypot(bx - ax, bz - az) || 1
      // outward normal in the x-z plane
      const [nx, nz] = area > 0 ? [(bz - az) / len, -(bx - ax) / len] : [-(bz - az) / len, (bx - ax) / len]
      if (nx * view[0] + nz * view[2] <= 1e-6) continue
      const quad = orient([near[i], near[j], far[j], far[i]])
      fill.push(K.pathOf(quad, true))
      const light = (nx * -cam.sinA + nz * 0.9 + 1) / 2
      buckets[Math.min(3, Math.max(0, Math.floor(light * 4)))].push(K.pathOf(quad, true))
      outline.push(K.pathOf([far[i], far[j]]))
      crease.push(K.pathOf([near[i], far[i]]))
    }
    return { fill: fill.join(''), outline: outline.join(''), crease: crease.join(''), top: K.pathOf(near, true), shades: buckets.map((b) => b.join('')) }
  }
  /** A circle in the x-z plane, for wheel profiles. */
  const disc = (cx: number, cz: number, r: number, steps = 22): [number, number][] => Array.from({ length: steps }, (_, k) => [cx + Math.cos((k / steps) * Math.PI * 2) * r, cz + Math.sin((k / steps) * Math.PI * 2) * r])
  /** Paint back to front: farther items first. */
  const byDepth = <T>(items: T[], at: (t: T) => Point3) => [...items].sort((a, b) => K.depthOf(at(a), P) - K.depthOf(at(b), P))
  return { solid, slab, cyl, line, dots, top, text, byDepth, prismY, disc }
}
export type Tools = ReturnType<typeof tools>

/** Fit the camera to the fully exploded object, then let the module draw each layer. */
export function explode(
  footprint: Plan,
  specs: LayerSpec[],
  draw: (t: Tools, P: Projection) => Record<string, (lit: boolean) => string>,
  { azimuth = 40, elevation = 30, headroom = 0, w = W, h = H, tags = true, extra = [] }: { azimuth?: number; elevation?: number; headroom?: number; w?: number; h?: number; tags?: boolean; extra?: Point3[] } = {},
): Exploded {
  const pts: Point3[] = [...K.boxCorners(footprint, 0, 0), ...extra]
  const toOf = (s: LayerSpec): Point3 => s.move ?? [0, 0, s.follow ? specs.find((o) => o.id === s.follow)!.lift : s.lift]
  for (const s of specs) {
    const [dx, dy, dz] = toOf(s)
    pts.push(...K.boxCorners(s.plan, s.z0, s.top + headroom))
    pts.push(...K.boxCorners({ ...s.plan, x: s.plan.x + dx, y: s.plan.y + dy }, s.z0 + dz, s.top + dz + headroom))
  }
  // room on the right for the number tags
  const fit = K.fitProjection(pts, tags ? w - 70 : w, h, { pad: 18, azimuth, elevation })
  const P = fit
  const art = draw(tools(P), P)
  const layers = specs.map((s) => {
    const flat = K.pointsAt(K.boxCorners(s.plan, s.z0 - 1, s.top + 1), P)
    const right = flat.reduce((a, b) => (b[0] > a[0] ? b : a))
    return { ...s, to: toOf(s), svg: art[s.id], hit: hull(flat).map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' '), tag: right }
  })
  // rest-pose bounds → how much closer the camera can sit when the object is assembled
  const rest = specs.flatMap((s) => K.pointsAt(K.boxCorners(s.plan, s.z0, s.top), P))
  const xs = rest.map((q) => q[0])
  const ys = rest.map((q) => q[1])
  const bx = Math.min(...xs), by = Math.min(...ys), bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by
  const ns = tags ? Math.max(1, Math.min(1.7, (w * 0.7) / bw, (h * 0.72) / bh)) : 1
  const near = { s: ns, tx: (tags ? (w - 70) / 2 : w / 2) - (bx + bw / 2) * ns, ty: h / 2 - (by + bh / 2) * ns }
  const shadow = K.insetPlan(footprint, -6)
  const floor = `<path class="iso-halo" d="${K.slabOf(shadow, -1, 1, P, 8).fill}"/>`
  return { P, floor, layers, moveBy: (d) => K.translateAlong(P, d), tags, w, h, near }
}

export function hull(points: K.Flat[]) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const cross = (o: K.Flat, a: K.Flat, b: K.Flat) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: K.Flat[] = []
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop()
    lower.push(q)
  }
  const upper: K.Flat[] = []
  for (const q of [...p].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop()
    upper.push(q)
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** How far an element has travelled up through the viewport: 0 as it enters the lower part, 1 near the top. */
export function scrollProgress(el: Element, from = 0.9, to = 0.25) {
  const r = el.getBoundingClientRect()
  const vh = window.innerHeight || 800
  return clamp01((vh * from - r.top) / (vh * (from - to)))
}
