// Six event scenes, one per kind of news. Each is a small bench mechanism whose parts move as the story scrolls by:
// earnings stack up by quarter, a customs gate closes on a crate of chips, a press ships a new product, a loupe reads
// a case file, the head chair at a board table changes, and a press joins two companies.
import type { Plan, Point3 } from '../../iso/iso-kit'
import * as K from '../../iso/iso-kit'
import { explode, type Exploded, type LayerSpec, type Tools } from '../exploded'

export type EventKind = 'earnings' | 'regulation' | 'launch' | 'probe' | 'leadership' | 'deal'

const B: Plan = { x: 0, y: 0, w: 240, d: 150, r: 6 }
const BZ = 8
const W = 760
const H = 460

/** The shared bench: plate on four feet, an engraved groove, corner screws and a ruler strip. */
function bench({ solid, slab, cyl, line, dots, top }: Tools, P: K.Projection, label: string) {
  const out: string[] = []
  for (const [x, y] of K.corners(B, 14)) out.push(solid(cyl(x, y, 7, -6, 6, 20), { tone: 'mid' }))
  out.push(solid(slab(B, 0, BZ, 8, 1), { tone: 'hi', halo: true, inner: line(K.sideSeam(B, BZ * 0.5, P, 8), 'faint') }))
  out.push(line(K.planOutline(K.insetPlan(B, 6), BZ, P, 6), 'faint'))
  for (const [x, y] of K.corners(B, 11)) out.push(line(K.ring(x, y, 1.5, BZ, P, 12), 'lo'), dots([[x, y, BZ]], 0.55, 'hi'))
  const t = K.topTicks(20, 220, 4, 5, B.d - 16, BZ, [2.5, 5], P)
  out.push(line(t.minor, 'lo'), line(t.major, 'mid'))
  out.push(K.faceTextSvg(K.topMatrix([B.w - 70, B.d - 24], BZ, P), label, { size: 5, tone: 'mid' }))
  void top
  return out.join('')
}

const opts = { tags: false, azimuth: 50, w: W, h: H }
const S = (id: string, plan: Plan, z0: number, top: number, move: Point3 = [0, 0, 0], span: [number, number] = [0, 1]): LayerSpec => ({ id, plan, z0, top, lift: 0, move, span })

/* ---------- earnings: coins stack up by quarter ---------- */
const COINS = [4, 6, 8, 11]
const qx = (i: number) => 50 + i * 48
function earnings() {
  const specs: LayerSpec[] = [S('bench', B, -6, BZ), ...COINS.map((n, i) => S(`q${i + 1}`, { x: qx(i) - 17, y: 48, w: 34, d: 34, r: 17 }, BZ + 80, BZ + 80 + n * 4, [0, 0, -80], [i * 0.15, 0.45 + i * 0.18]))]
  return explode(B, specs, (t, P) => {
    const art: Record<string, (lit: boolean) => string> = { bench: () => bench(t, P, 'QUARTERLY') + COINS.map((_, i) => K.faceTextSvg(K.topMatrix([qx(i) - 5, 100], BZ, P), `Q${i + 1}`, { size: 7, tone: 'mid' }) + t.line(K.ring(qx(i), 65, 18, BZ, P, 32), 'faint', { dashed: true })).join('') }
    COINS.forEach((n, i) => {
      art[`q${i + 1}`] = (lit) => {
        const out: string[] = []
        for (let k = 0; k < n; k++) out.push(t.solid(t.cyl(qx(i), 65, 16, BZ + 80 + k * 4, 3.4, 32, 0.4), { tone: 'hi', lit: lit || i === 3, inner: t.line(K.ring(qx(i), 65, 11, BZ + 83.4 + k * 4, P, 24), 'faint') }))
        return out.join('')
      }
    })
    return art
  }, opts)
}

/* ---------- regulation: a customs gate closes on a crate of chips ---------- */
function regulation() {
  const TR: Plan = { x: 12, y: 62, w: 216, d: 26, r: 2 }
  const crate: Plan = { x: 22, y: 64, w: 30, d: 22, r: 1 }
  const specs = [S('bench', B, -6, BZ + 4), S('crate', crate, BZ + 4, BZ + 22, [84, 0, 0], [0, 0.6]), S('gate', { x: 150, y: 44, w: 14, d: 62, r: 1 }, BZ, BZ + 70), S('arm', { x: 152, y: 50, w: 8, d: 50, r: 1 }, BZ + 56, BZ + 62, [0, 0, -30], [0.5, 1])]
  return explode(B, specs, (t, P) => ({
    bench: () => {
      const out = [bench(t, P, 'CUSTOMS')]
      out.push(t.solid(t.slab(TR, BZ, 4, 3, 0.5), { tone: 'hi' }))
      for (let x = TR.x + 10; x < TR.x + TR.w - 6; x += 10) out.push(t.line(t.top([x, TR.y + 4], [x, TR.y + TR.d - 4], BZ + 4), 'faint'))
      // stop line painted on the track
      out.push(t.line(t.top([142, TR.y + 2], [142, TR.y + TR.d - 2], BZ + 4), 'hi', { dashed: true }))
      return out.join('')
    },
    crate: (lit) => {
      const grid: string[] = []
      for (let k = 1; k < 4; k++) grid.push(t.line(t.top([crate.x + k * 7.5, crate.y + 3], [crate.x + k * 7.5, crate.y + crate.d - 3], BZ + 22), 'mid'))
      for (let k = 1; k < 3; k++) grid.push(t.line(t.top([crate.x + 3, crate.y + k * 7.3], [crate.x + crate.w - 3, crate.y + k * 7.3], BZ + 22), 'mid'))
      return t.solid(t.slab(crate, BZ + 4, 18, 2, 0.5), { tone: 'hi', lit: true, inner: grid.join('') }) + (lit ? '' : '')
    },
    gate: () => {
      const out: string[] = []
      for (const y of [46, 98]) {
        out.push(t.solid(t.slab({ x: 152, y: y - 2, w: 10, d: 10, r: 1 }, BZ, 3, 3, 0.3), { tone: 'mid' }))
        out.push(t.solid(t.slab({ x: 154, y, w: 6, d: 6, r: 0.6 }, BZ + 3, 66, 2, 0.3), { tone: 'hi' }))
      }
      out.push(t.solid(t.slab({ x: 150, y: 44, w: 10, d: 62, r: 1 }, BZ + 69, 6, 3, 0.5), { tone: 'hi' }))
      out.push(K.faceTextSvg(K.sideMatrix([150, 60], BZ + 74, P, 'left'), 'EXPORT', { size: 4.6, tone: 'mid' }))
      return out.join('')
    },
    arm: () => {
      const arm: Plan = { x: 153, y: 52, w: 8, d: 46, r: 1 }
      const stripes = [0, 1, 2, 3, 4].map((k) => t.line(t.top([arm.x + 1, arm.y + 4 + k * 9], [arm.x + 7, arm.y + 8 + k * 9], BZ + 62), 'mid')).join('')
      return t.solid(t.slab(arm, BZ + 56, 6, 2, 0.4), { tone: 'hi', inner: stripes })
    },
  }), opts)
}

/* ---------- launch: a press ships a new product down the line ---------- */
function launch() {
  const BELT: Plan = { x: 12, y: 60, w: 216, d: 30, r: 3 }
  const box: Plan = { x: 46, y: 63, w: 28, d: 24, r: 1 }
  const specs = [S('bench', B, -6, BZ + 6), S('frame', { x: 36, y: 40, w: 48, d: 70, r: 1 }, BZ, BZ + 78), S('box', box, BZ + 6, BZ + 26, [120, 0, 0], [0.35, 1]), S('platen', { x: 40, y: 58, w: 40, d: 34, r: 1 }, BZ + 30, BZ + 40, [0, 0, 22], [0, 0.35])]
  return explode(B, specs, (t, P) => ({
    bench: () => {
      const out = [bench(t, P, 'LINE 01')]
      out.push(t.solid(t.slab(BELT, BZ, 6, 4, 0.6), { tone: 'hi', inner: t.line(K.sideSeam(BELT, BZ + 3, P, 4), 'faint') }))
      for (let x = BELT.x + 8; x < BELT.x + BELT.w - 4; x += 8) out.push(t.line(t.top([x, BELT.y + 3], [x, BELT.y + BELT.d - 3], BZ + 6), 'faint'))
      for (const x of [BELT.x + 6, BELT.x + BELT.w - 6]) out.push(t.dots([[x, BELT.y + BELT.d / 2, BZ + 6]], 0.8, 'mid'))
      return out.join('')
    },
    frame: () => {
      const out: string[] = []
      for (const [x, y] of [[38, 42], [76, 42]] as [number, number][]) out.push(t.solid(t.slab({ x, y, w: 6, d: 6, r: 0.6 }, BZ, 76, 2), { tone: 'hi' }))
      out.push(t.solid(t.slab({ x: 36, y: 40, w: 48, d: 70, r: 1.5 }, BZ + 76, 8, 3, 0.6), { tone: 'hi', inner: t.line(K.sideSeam({ x: 36, y: 40, w: 48, d: 70, r: 1.5 }, BZ + 80, P, 3), 'faint') }))
      return out.join('')
    },
    platen: () => t.solid(t.cyl(60, 75, 3, BZ + 40, 36, 14), { tone: 'mid' }) + t.solid(t.slab({ x: 40, y: 58, w: 40, d: 34, r: 1 }, BZ + 30, 10, 3, 0.6), { tone: 'hi' }),
    box: () => {
      const ribbon = t.line(t.top([box.x + box.w / 2, box.y], [box.x + box.w / 2, box.y + box.d], BZ + 26), 'mid') + t.line(t.top([box.x, box.y + box.d / 2], [box.x + box.w, box.y + box.d / 2], BZ + 26), 'mid')
      return t.solid(t.slab(box, BZ + 6, 20, 2, 0.6), { tone: 'hi', lit: true, inner: ribbon }) + t.dots([[box.x + box.w / 2, box.y + box.d / 2, BZ + 26]], 1, 'hi')
    },
    // the product's legs stay hidden under the platen until it leaves
  }), opts)
}

/* ---------- probe: a loupe reads a case file ---------- */
function probe() {
  const FILE: Plan = { x: 40, y: 34, w: 120, d: 84, r: 2 }
  const specs = [S('bench', B, -6, BZ + 6), S('loupe', { x: 150, y: 40, w: 50, d: 50, r: 25 }, BZ + 18, BZ + 24, [-78, 24, 0], [0, 1])]
  return explode(B, specs, (t, P) => ({
    bench: () => {
      const out = [bench(t, P, 'CASE FILE')]
      out.push(t.solid(t.slab(FILE, BZ, 2, 3, 0.3), { tone: 'mid' }))
      for (let k = 0; k < 3; k++) {
        const sheet: Plan = { x: FILE.x + 6 + k * 2, y: FILE.y + 4 - k * 2, w: FILE.w - 16, d: FILE.d - 10, r: 0.5 }
        const lines = k === 2 ? Array.from({ length: 8 }, (_, j) => t.line(t.top([sheet.x + 8, sheet.y + 10 + j * 8], [sheet.x + sheet.w - 8 - (j % 3) * 14, sheet.y + 10 + j * 8], BZ + 3.2 + k), j === 3 ? 'hi' : 'lo')).join('') : ''
        out.push(t.solid(t.slab(sheet, BZ + 2 + k, 1.2, 2), { tone: 'hi', flat: true, inner: lines }))
      }
      // the tab and a clip
      out.push(t.solid(t.slab({ x: FILE.x + FILE.w - 30, y: FILE.y - 8, w: 24, d: 8, r: 1 }, BZ, 2, 2), { tone: 'mid' }))
      out.push(t.solid(t.slab({ x: FILE.x + 30, y: FILE.y - 4, w: 18, d: 6, r: 0.8 }, BZ + 5, 2, 2), { tone: 'hi' }))
      return out.join('')
    },
    loupe: () => {
      const cx = 175
      const cy = 65
      const out: string[] = []
      // handle first (it points toward the back right), then the rim and lens
      out.push(t.solid(t.slab({ x: cx + 18, y: cy - 34, w: 8, d: 30, r: 3 }, BZ + 18, 6, 3, 0.5), { tone: 'hi' }))
      out.push(t.solid(t.cyl(cx, cy, 25, BZ + 18, 6, 40, 0.6), { tone: 'hi', lit: true }))
      out.push(t.solid(t.cyl(cx, cy, 20, BZ + 24, 0.4, 40), { tone: 'mid', flat: true, inner: t.line(K.ring(cx - 4, cy - 4, 9, BZ + 24.4, P, 20), 'faint') }))
      return out.join('')
    },
  }), opts)
}

/* ---------- leadership: the head chair at the board table changes ---------- */
function leadership() {
  const TABLE: Plan = { x: 30, y: 50, w: 150, d: 50, r: 8 }
  const chair = ({ solid, slab, cyl }: Tools, x: number, y: number, face: 'x' | 'y-' | 'y+', lit = false) => {
    const out: string[] = []
    out.push(solid(cyl(x, y, 1.6, BZ, 12, 10), { tone: 'mid' }))
    out.push(solid(slab({ x: x - 9, y: y - 9, w: 18, d: 18, r: 2 }, BZ + 12, 3, 3, 0.4), { tone: 'hi', lit }))
    const back: Plan = face === 'x' ? { x: x + 7, y: y - 9, w: 3, d: 18, r: 0.6 } : face === 'y-' ? { x: x - 9, y: y - 10, w: 18, d: 3, r: 0.6 } : { x: x - 9, y: y + 7, w: 18, d: 3, r: 0.6 }
    out.push(solid(slab(back, BZ + 15, 18, 2, 0.4), { tone: 'hi', lit }))
    return out.join('')
  }
  const specs = [S('bench', B, -6, BZ + 22), S('table', TABLE, BZ, BZ + 22), S('front', { x: 40, y: 104, w: 130, d: 20, r: 1 }, BZ, BZ + 33), S('old', { x: 186, y: 66, w: 20, d: 20, r: 1 }, BZ, BZ + 33, [36, -40, 0], [0, 0.5]), S('new', { x: 186, y: 66, w: 20, d: 20, r: 1 }, BZ, BZ + 33, [0, 0, 0], [0.5, 1])]
  // the new chair rolls in from the front edge: drawn at the front, moved back to the head
  specs[4] = { ...specs[4], plan: { x: 186, y: 116, w: 20, d: 20, r: 1 }, move: [0, -50, 0] }
  return explode(B, specs, (t, P) => ({
    bench: () => bench(t, P, 'BOARDROOM') + [55, 95, 135].map((x) => chair(t, x, 36, 'y-')).join(''),
    table: () => t.solid(t.slab(TABLE, BZ + 18, 4, 8, 0.8), { tone: 'hi', inner: t.line(K.planOutline(K.insetPlan(TABLE, 5), BZ + 22, P, 6), 'faint') }) + t.solid(t.cyl(70, 75, 4, BZ, 18, 14), { tone: 'mid' }) + t.solid(t.cyl(140, 75, 4, BZ, 18, 14), { tone: 'mid' }),
    front: () => [55, 95, 135].map((x) => chair(t, x, 114, 'y+')).join(''),
    old: () => chair(t, 196, 76, 'x'),
    new: () => chair(t, 196, 126, 'x', true),
  }), opts)
}

/* ---------- deal: a press joins two companies into one ---------- */
function deal() {
  const A: Plan = { x: 40, y: 55, w: 50, d: 40, r: 1.5 }
  const Bk: Plan = { x: 150, y: 55, w: 50, d: 40, r: 1.5 }
  const specs = [S('bench', B, -6, BZ + 4), S('left', A, BZ + 4, BZ + 22, [30, 0, 0], [0, 0.6]), S('right', Bk, BZ + 4, BZ + 22, [-30, 0, 0], [0, 0.6]), S('head', { x: 100, y: 55, w: 40, d: 40, r: 2 }, BZ + 66, BZ + 76, [0, 0, -26], [0.6, 1])]
  return explode(B, specs, (t, P) => ({
    bench: () => {
      const out = [bench(t, P, 'MERGER')]
      out.push(t.solid(t.slab({ x: 20, y: 50, w: 200, d: 50, r: 2 }, BZ, 4, 3, 0.4), { tone: 'mid' }))
      // the press columns behind
      for (const x of [86, 150]) out.push(t.solid(t.cyl(x, 46, 3, BZ, 90, 14), { tone: 'hi' }))
      out.push(t.solid(t.slab({ x: 80, y: 40, w: 76, d: 12, r: 1.5 }, BZ + 90, 8, 3, 0.5), { tone: 'hi' }))
      return out.join('')
    },
    left: () => {
      // tongue on the right face
      const tongue: Plan = { x: A.x + A.w, y: A.y + 12, w: 10, d: 16, r: 0.5 }
      return t.solid(t.slab(A, BZ + 4, 18, 3, 0.5), { tone: 'hi', inner: t.line(K.planOutline(K.insetPlan(A, 5), BZ + 22, P, 3), 'faint') }) + t.solid(t.slab(tongue, BZ + 8, 10, 2, 0.3), { tone: 'hi', lit: true })
    },
    right: () => t.solid(t.slab(Bk, BZ + 4, 18, 3, 0.5), { tone: 'hi', inner: t.line(K.planOutline(K.insetPlan(Bk, 5), BZ + 22, P, 3), 'faint') + t.line(t.top([Bk.x, Bk.y + 12], [Bk.x, Bk.y + 28], BZ + 22), 'mid') }),
    head: () => t.solid(t.cyl(120, 75, 4, BZ + 76, 14, 14), { tone: 'mid' }) + t.solid(t.slab({ x: 100, y: 55, w: 40, d: 40, r: 2 }, BZ + 66, 10, 3, 0.6), { tone: 'hi', inner: t.line(K.sideSeam({ x: 100, y: 55, w: 40, d: 40, r: 2 }, BZ + 71, P, 3), 'faint') }),
  }), { ...opts, extra: [[86, 46, BZ + 100], [156, 46, BZ + 100]] })
}

const builders: Record<EventKind, () => Exploded> = { earnings, regulation, launch, probe, leadership, deal }
const cache = new Map<EventKind, Exploded>()
export function eventScene(kind: EventKind) {
  if (!cache.has(kind)) cache.set(kind, builders[kind]())
  return cache.get(kind)!
}
