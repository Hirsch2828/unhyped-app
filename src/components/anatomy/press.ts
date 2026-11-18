// "The Unhyped press": a bench machine whose working is the product.
// Slips (articles) stand in a tiered rack by source tier, a screw press squeezes duplicate slips into one card
// (one story), a stamp bridge marks it Official / Report / Rumor, a gate with a loupe holds important cards for a
// person, and the tray collects today's issue. Built once with the anatomy kit; only the movers are animated.
import * as K from '../iso/iso-kit'
import type { Plan, Point3, Projection, SolidPaths } from '../iso/iso-kit'

export type StationId = 'sources' | 'dedup' | 'label' | 'review' | 'issue'
export const STATIONS: StationId[] = ['sources', 'dedup', 'label', 'review', 'issue']

export const W = 760
export const H = 400

// World layout (x along the bench, y toward the viewer, z up; ~1 unit = 1 px of the real thing).
const BASE: Plan = { x: 0, y: 0, w: 580, d: 190, r: 9 }
const BZ = 12 // base thickness
const TRACK: Plan = { x: 16, y: 96, w: 548, d: 26, r: 2 }
const TZ = BZ + 4 // track top
const TRACK_Y = TRACK.y + TRACK.d / 2

// Station x ranges, used for the hit areas and the zoom.
export const RANGES: Record<StationId, [number, number]> = {
  sources: [10, 132],
  dedup: [140, 238],
  label: [250, 372],
  review: [384, 462],
  issue: [470, 572],
}

const P: Projection = K.fitProjection(
  [...K.boxCorners(BASE, -8, BZ), [200, 70, 150], [310, 66, 128], [40, 20, BZ + 70]],
  W,
  H,
  { pad: 14, azimuth: 66, elevation: 30 },
)
export const projection = P

const solid = (paths: SolidPaths, o: K.SolidStyle = {}) => K.solidSvg(paths, o)
const slab = (plan: Plan, z: number, h: number, steps = 3, bevel = 0) => K.slabOf(plan, z, h, P, steps, bevel)
const cyl = (cx: number, cy: number, r: number, z: number, h: number, steps = 20, bevel = 0) => K.cylinder(cx, cy, r, z, h, P, steps, bevel)
const line = (d: string, tone: K.LineTone = 'lo', free?: boolean) => K.lineSvg(d, { tone, free })
const dots = (pts: Point3[], size = 0.55, tone: K.Tone = 'mid') => K.dotsSvg(K.pointsAt(pts, P), { size, tone })

/* ---------- Base, feet, groove, ruler, label plate ---------- */
function base() {
  const out: string[] = []
  for (const [x, y] of K.corners(BASE, 16)) out.push(solid(cyl(x, y, 8, -8, 8, 24), { tone: 'mid' }))
  const groove = K.insetPlan(BASE, 7)
  out.push(
    solid(slab(BASE, 0, BZ, 9, 1.2), {
      tone: 'hi',
      halo: true,
      inner: line(K.sideSeam(BASE, BZ * 0.45, P, 9), 'faint'),
    }),
  )
  out.push(line(K.planOutline(groove, BZ, P, 8), 'faint'))
  // corner screws with rings
  for (const [x, y] of K.corners(BASE, 13)) {
    out.push(line(K.ring(x, y, 1.6, BZ, P, 14), 'lo'))
    out.push(dots([[x, y, BZ]], 0.6, 'hi'))
  }
  // ruler strip along the front edge with ticks every 5, a major every 25
  const strip: Plan = { x: 24, y: 160, w: 400, d: 12, r: 0 }
  out.push(solid(slab(strip, BZ, 0.8, 2), { tone: 'mid', flat: true }))
  const t = K.topTicks(28, 420, 5, 5, strip.y, BZ + 0.8, [3, 6], P)
  out.push(line(t.minor, 'lo'), line(t.major, 'mid'))
  // label plate with three engraved rule lines and one tiny engraved name
  const plate: Plan = { x: 450, y: 152, w: 106, d: 26, r: 1.5 }
  out.push(solid(slab(plate, BZ, 1, 3, 0.4), { tone: 'mid' }))
  for (const [x, y] of K.corners(plate, 3)) out.push(dots([[x, y, BZ + 1]], 0.45, 'mid'))
  out.push(K.faceTextSvg(K.topMatrix([plate.x + 8, plate.y + 10], BZ + 1, P), 'UNHYPED · PRESS', { size: 5.2, tone: 'hi' }))
  for (let i = 0; i < 2; i++) out.push(line(K.lineOnTop([plate.x + 8, plate.y + 15 + i * 4.5], [plate.x + 70 - i * 18, plate.y + 15 + i * 4.5], BZ + 1, P), 'lo', true))
  return out.join('')
}

/* ---------- The track the cards ride on ---------- */
function track() {
  const out: string[] = []
  out.push(solid(slab(TRACK, BZ, 4, 3, 0.5), { tone: 'hi' }))
  // two guide rails with end stops
  for (const y of [TRACK.y + 3, TRACK.y + TRACK.d - 3]) out.push(line(K.lineOnTop([TRACK.x + 6, y], [TRACK.x + TRACK.w - 6, y], TZ, P), 'faint'))
  for (const x of [TRACK.x + 3, TRACK.x + TRACK.w - 7]) out.push(solid(slab({ x, y: TRACK.y + 1, w: 4, d: TRACK.d - 2, r: 0.6 }, TZ, 3, 2), { tone: 'mid' }))
  return out.join('')
}

/* ---------- 1. Sources: a tiered rack of slips, one row per tier ---------- */
export interface Tiers { official: number; news: number; signal: number }
export function sources(t: Tiers, lit = false) {
  const out: string[] = []
  const x0 = 18
  const w = 110
  // back to front: official (tallest), news, signal
  const rows: [number, number, number, number, string][] = [
    // y, depth, height, count, engraved name
    [14, 24, 40, t.official, 'OFFICIAL'],
    [38, 24, 26, t.news, 'NEWS'],
    [62, 24, 12, t.signal, 'COMMUNITY'],
  ]
  for (const [y, d, h, count, name] of rows) {
    const step: Plan = { x: x0, y, w, d, r: 1.2 }
    out.push(solid(slab(step, BZ, h, 3, 0.6), { tone: 'hi', inner: line(K.sideSeam(step, BZ + h - 3, P, 3), 'faint') }))
    out.push(line(K.lineOnTop([x0 + 4, y + d / 2], [x0 + w - 4, y + d / 2], BZ + h, P), 'faint'))
    // slips standing in the slot, evenly spread
    const n = Math.max(1, count)
    const gap = (w - 12) / n
    for (let i = 0; i < n; i++) {
      const sx = x0 + 6 + i * gap + gap / 2 - 0.9
      out.push(solid(slab({ x: sx, y: y + 5, w: 1.8, d: d - 10, r: 0.3 }, BZ + h, 14 + ((i * 7) % 5), 2), { tone: 'mid', crease: 'none', lit: lit && name === 'OFFICIAL' }))
    }

  }
  // side cheeks of the rack
  for (const x of [x0 - 4, x0 + w]) out.push(solid(slab({ x, y: 12, w: 4, d: 76, r: 0.8 }, BZ, 8, 2), { tone: 'mid' }))
  return out.join('')
}

/* ---------- 2. Dedup: a screw press over a stack of duplicate slips ---------- */
const PX = 189
export function pressFrame() {
  const out: string[] = []
  const posts: [number, number][] = [
    [PX, TRACK.y - 12],
    [PX, TRACK.y + TRACK.d + 12],
  ]
  // feet plates under the posts
  for (const [x, y] of posts) {
    const foot: Plan = { x: x - 8, y: y - 8, w: 16, d: 16, r: 1.5 }
    out.push(solid(slab(foot, BZ, 2.5, 3, 0.4), { tone: 'mid' }))
    for (const [cx, cy] of K.corners(foot, 2.6)) out.push(dots([[cx, cy, BZ + 2.5]], 0.45, 'mid'))
  }
  out.push(solid(cyl(posts[0][0], posts[0][1], 4, BZ + 2.5, 118, 24), { tone: 'hi' }))
  return { back: out.join(''), front: solid(cyl(posts[1][0], posts[1][1], 4, BZ + 2.5, 118, 24), { tone: 'hi' }) }
}
// A dial gauge clamped to the front post: its needle counts the slips merged into the card.
export const DIAL = { x: PX + 9, y: TRACK.y + TRACK.d + 12, z: BZ + 78, r: 11 }
export function dialFace() {
  const out: string[] = []
  const { x, y, z, r } = DIAL
  out.push(solid(slab({ x: x - 5, y: y - 3, w: 6, d: 6, r: 0.8 }, z - 4, 8, 2), { tone: 'mid' }))
  out.push(solid(cyl(x + 6, y, r, z - r, 3, 36, 0.4), { tone: 'hi' }))
  const t = K.radialTicks(x + 6, y, r - 1.5, 30, 5, z - r + 3, [1.2, 2.6], P)
  out.push(line(t.minor, 'lo'), line(t.major, 'mid'))
  return out.join('')
}
export function needle(k: number) {
  const { x, y, z, r } = DIAL
  const a = -Math.PI * 0.8 + k * Math.PI * 1.6
  const cx = x + 6
  const tip: K.Plane = [cx + Math.sin(a) * (r - 3), y - Math.cos(a) * (r - 3)]
  return line(K.lineOnTop([cx, y], tip, z - r + 3.2, P), 'lit', true) + dots([[cx, y, z - r + 3.2]], 0.9, 'hi')
}
export function pressTop() {
  const out: string[] = []
  const bar: Plan = { x: PX - 7, y: TRACK.y - 20, w: 14, d: TRACK.d + 40, r: 1.5 }
  out.push(solid(slab(bar, BZ + 120, 10, 3, 0.6), { tone: 'hi', inner: line(K.sideSeam(bar, BZ + 125, P, 3), 'faint') }))
  out.push(solid(cyl(PX, TRACK_Y, 3, BZ + 130, 8, 16), { tone: 'mid' }))
  // knurled hand wheel
  out.push(solid(cyl(PX, TRACK_Y, 15, BZ + 138, 6, 40, 0.6), { tone: 'hi', inner: line(K.knurl(PX, TRACK_Y, 15, BZ + 138, BZ + 144, 36, P), 'lo') }))
  out.push(line(K.ring(PX, TRACK_Y, 4, BZ + 144, P, 16), 'mid'))
  return out.join('')
}
// The screw and platen move together (built at rest, translated down when pressing).
export function platen() {
  const out: string[] = []
  out.push(solid(cyl(PX, TRACK_Y, 2.2, BZ + 64, 56, 14), { tone: 'mid', inner: line(K.knurl(PX, TRACK_Y, 2.2, BZ + 66, BZ + 118, 10, P), 'faint') }))
  const plate: Plan = { x: PX - 17, y: TRACK.y + 1, w: 34, d: TRACK.d - 2, r: 1 }
  out.push(solid(slab(plate, BZ + 56, 8, 3, 0.6), { tone: 'hi', inner: line(K.sideSeam(plate, BZ + 59, P, 3), 'faint') }))
  return out.join('')
}
export const PLATEN_TRAVEL = 36
// Seven duplicate slips, slightly askew, as they arrive.
export function stack(lit = false) {
  const out: string[] = []
  for (let i = 0; i < 7; i++) {
    const s: Plan = { x: PX - 14 + ((i * 3) % 4) - 1.5, y: TRACK.y + 4 + ((i * 5) % 3) - 1, w: 26, d: TRACK.d - 8, r: 0.5 }
    out.push(solid(slab(s, TZ + i * 2.4, 1.4, 2), { tone: i === 6 && lit ? 'hi' : 'mid', crease: 'none', lit: lit && i === 6 }))
  }
  return out.join('')
}

/* ---------- 3. Label: a bridge with three stamps ---------- */
export const STAMP_X = [287, 311, 335]
export const STAMP_TRAVEL = 46
export function bridge() {
  const out: string[] = []
  const y = TRACK.y - 26
  for (const x of [264, 358]) {
    const foot: Plan = { x: x - 7, y: y - 7, w: 14, d: 14, r: 1.4 }
    out.push(solid(slab(foot, BZ, 2.5, 3, 0.4), { tone: 'mid' }))
    out.push(solid(cyl(x, y, 3.6, BZ + 2.5, 96, 22), { tone: 'hi' }))
  }
  const beam: Plan = { x: 258, y: y - 6, w: 106, d: 12, r: 1.2 }
  out.push(solid(slab(beam, BZ + 98, 10, 3, 0.6), { tone: 'hi', inner: line(K.sideSeam(beam, BZ + 103, P, 3), 'faint') }))
  for (const x of STAMP_X) {
    const arm: Plan = { x: x - 3.5, y: y + 6, w: 7, d: TRACK_Y - y - 2, r: 0.8 }
    out.push(solid(slab(arm, BZ + 100, 6, 2, 0.3), { tone: 'mid' }))
    out.push(dots([[x, y, BZ + 108]], 0.5, 'mid'))
  }
  return out.join('')
}
// One stamp: guide sleeve, rod, foot. The foot's face says which label it prints.
export function stamp(i: number, lit = false) {
  const x = STAMP_X[i]
  const out: string[] = []
  out.push(solid(cyl(x, TRACK_Y, 2, BZ + 56, 46, 14), { tone: 'mid' }))
  out.push(solid(cyl(x, TRACK_Y, 4.5, BZ + 92, 6, 18, 0.4), { tone: 'hi' }))
  const foot: Plan = { x: x - 9, y: TRACK.y + 4, w: 18, d: TRACK.d - 8, r: 0.8 }
  out.push(solid(slab(foot, BZ + 48, 8, 3, 0.4), { tone: 'hi', lit }))
  return out.join('')
}

/* ---------- 4. Review: a gate, a loupe and a lamp ---------- */
const GX = 420
export const GATE_LIFT = 26
export function gateBack() {
  const out: string[] = []
  // loupe stand behind the track
  const ly = TRACK.y - 16
  out.push(solid(cyl(GX + 22, ly, 7, BZ, 3, 24, 0.4), { tone: 'mid' }))
  out.push(solid(cyl(GX + 22, ly, 1.8, BZ + 3, 66, 14), { tone: 'hi' }))
  out.push(solid(slab({ x: GX + 20, y: ly, w: 4, d: TRACK_Y - ly, r: 0.6 }, BZ + 66, 3, 2), { tone: 'mid' }))
  return out.join('')
}
export function loupe(lit = false) {
  return solid(cyl(GX + 22, TRACK_Y, 11, BZ + 62, 3, 40, 0.5), { tone: 'hi', lit, inner: line(K.sideArc(GX + 22, TRACK_Y, 11, BZ + 63.5, P, 32), 'faint') })
}
export function gatePost() {
  const out: string[] = []
  const py = TRACK.y + TRACK.d + 12
  const foot: Plan = { x: GX - 7, y: py - 7, w: 14, d: 14, r: 1.4 }
  out.push(solid(slab(foot, BZ, 2.5, 3, 0.4), { tone: 'mid' }))
  for (const [cx, cy] of K.corners(foot, 2.4)) out.push(dots([[cx, cy, BZ + 2.5]], 0.45, 'mid'))
  out.push(solid(cyl(GX, py, 4.5, BZ + 2.5, 40, 22), { tone: 'hi' }))
  // the lamp on top: lit while a card is held for a person
  return out.join('')
}
export function lamp(on = false) {
  const py = TRACK.y + TRACK.d + 12
  return solid(cyl(GX, py, 5.5, BZ + 42.5, 7, 22, 0.5), { tone: 'hi', lit: on })
}
// The barrier arm across the track (lifts when the editor approves).
export function arm() {
  const a: Plan = { x: GX - 3, y: TRACK.y - 6, w: 6, d: TRACK.d + 18, r: 1 }
  return solid(slab(a, BZ + 30, 5, 2, 0.4), { tone: 'hi', inner: line(K.sideSeam(a, BZ + 32.5, P, 2), 'faint') })
}

/* ---------- 5. Issue: the tray with today's cards ---------- */
const TRAY: Plan = { x: 480, y: TRACK.y - 10, w: 84, d: TRACK.d + 20, r: 2 }
export function tray(n: number, lit = false, no = 0) {
  const out: string[] = []
  out.push(solid(slab(TRAY, TZ, 4, 3, 0.5), { tone: 'hi' }))
  // low walls on three sides
  out.push(solid(slab({ x: TRAY.x + TRAY.w - 4, y: TRAY.y, w: 4, d: TRAY.d, r: 0.6 }, TZ + 4, 8, 2), { tone: 'mid' }))
  out.push(solid(slab({ x: TRAY.x, y: TRAY.y, w: TRAY.w - 4, d: 4, r: 0.6 }, TZ + 4, 8, 2), { tone: 'mid' }))
  for (let i = 0; i < n; i++) {
    const c: Plan = { x: TRAY.x + 18 + (i % 2) * 1.2, y: TRAY.y + 10 + ((i * 2) % 3) * 0.6, w: 40, d: TRAY.d - 20, r: 0.6 }
    out.push(solid(slab(c, TZ + 4 + i * 2.2, 1.6, 2), { tone: i === n - 1 ? 'hi' : 'mid', crease: 'none', lit: lit && i === n - 1 }))
  }
  out.push(solid(slab({ x: TRAY.x, y: TRAY.y + TRAY.d - 4, w: TRAY.w - 4, d: 4, r: 0.6 }, TZ + 4, 6, 2), { tone: 'mid' }))
  // number flag at the back
  const flag: Plan = { x: TRAY.x + 6, y: TRAY.y - 6, w: 26, d: 3, r: 0.4 }
  out.push(solid(slab(flag, TZ, 26, 2), { tone: 'hi' }))
  if (no) out.push(K.faceTextSvg(K.sideMatrix([flag.x + 3, flag.y + flag.d], TZ + 22, P, 'left'), `No.${no}`, { size: 6, tone: 'hi' }))
  return out.join('')
}

/* ---------- The card that rides the track ---------- */
export const CARD_PATH: [number, number][] = [] // x positions are computed by the animation
export function card(lit = true) {
  const c: Plan = { x: -9, y: TRACK.y + 5, w: 18, d: TRACK.d - 10, r: 0.6 }
  return solid(slab(c, TZ, 1.8, 2), { tone: 'hi', lit })
}

/** Screen offset for a world move (for the animated parts). */
export const moveBy = (d: Point3) => K.translateAlong(P, d)

/** Screen-space bounding box of a station's slice of the bench, for the zoom. */
export function stationBox(id: StationId) {
  const [x0, x1] = RANGES[id]
  const pts: Point3[] = []
  const ys = id === 'sources' ? [10, 90] : [TRACK.y - 34, TRACK.y + TRACK.d + 22]
  for (const x of [x0, x1]) for (const y of ys) for (const z of [BZ, id === 'dedup' ? BZ + 146 : id === 'label' ? BZ + 110 : id === 'sources' ? BZ + 58 : BZ + 72]) pts.push([x, y, z])
  const flat = K.pointsAt(pts, P)
  const xs = flat.map((p) => p[0])
  const sy = flat.map((p) => p[1])
  return { x: Math.min(...xs), y: Math.min(...sy), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...sy) - Math.min(...sy) }
}

/** Hit area polygon (top of the base slice) for pointer selection. */
export function hitPolygon(id: StationId) {
  const [x0, x1] = RANGES[id]
  const top = id === 'dedup' ? BZ + 146 : id === 'label' ? BZ + 110 : BZ + 72
  const pts: Point3[] = [
    [x0, 0, -8], [x1, 0, -8], [x1, BASE.d, -8], [x0, BASE.d, -8],
  ]
  const up: Point3[] = pts.map(([x, y]) => [x, y, top])
  const flat = K.pointsAt([...pts, ...up], P)
  // convex hull of the slice
  return hull(flat).map((p) => p.join(',')).join(' ')
}
function hull(points: K.Flat[]) {
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

export const statics = { base: base(), track: track(), pressFrame: pressFrame(), pressTop: pressTop(), bridge: bridge(), gateBack: gateBack(), gatePost: gatePost(), arm: arm() }
export const TRACK_X = { start: 30, press: PX, stamp: STAMP_X, gate: GX - 24, tray: TRAY.x + 38 }
