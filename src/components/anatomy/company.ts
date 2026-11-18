// A company as one bench machine: a package (or whatever the company handles) rides a track through one station per
// product. Stations are built from a small library of kinds (gate, rack, scanner, dock, cluster, devices), so any
// company in `data/companies.ts` gets a machine from its data. Built once with the anatomy kit; only the crate moves.
import * as K from '../iso/iso-kit'
import type { Plan, Point3, Projection, SolidPaths } from '../iso/iso-kit'
import type { Company, PartKind } from '../../data/companies'

export const W = 760
export const H = 380
const STEP = 104 // bench length per station
const BZ = 12
const D = 190
const TRACK_Y0 = 104
const TRACK_D = 24
const TZ = BZ + 4
const TY = TRACK_Y0 + TRACK_D / 2

// How tall each kind stands, for the camera fit, the zoom and the hit areas.
const TOP: Record<PartKind, number> = { gate: 96, rack: 84, scanner: 86, dock: 44, cluster: 40, devices: 64 }

export interface Machine {
  P: Projection
  base: string
  stations: { id: string; back: (lit: boolean) => string; front: (lit: boolean) => string }[]
  crate: string
  /** x where the crate pauses at each station */
  stops: number[]
  startX: number
  endX: number
  box: (i: number) => { x: number; y: number; w: number; h: number }
  hit: (i: number) => string
  moveBy: (d: Point3) => string
}

export function buildMachine(c: Company): Machine {
  const n = c.parts.length
  const BASE: Plan = { x: 0, y: 0, w: 28 + n * STEP + 28, d: D, r: 9 }
  const x0 = (i: number) => 28 + i * STEP
  const mid = (i: number) => x0(i) + STEP / 2
  const tallest = Math.max(...c.parts.map((p) => TOP[p.kind ?? "rack"]))
  const P = K.fitProjection([...K.boxCorners(BASE, -8, BZ), [BASE.w / 2, 40, BZ + tallest], [BASE.w - 20, 20, BZ + 60], [20, 20, BZ + tallest]], W, H, { pad: 14, azimuth: 62, elevation: 30 })

  const solid = (paths: SolidPaths, o: K.SolidStyle = {}) => K.solidSvg(paths, o)
  const slab = (plan: Plan, z: number, h: number, steps = 3, bevel = 0) => K.slabOf(plan, z, h, P, steps, bevel)
  const cyl = (cx: number, cy: number, r: number, z: number, h: number, steps = 20, bevel = 0) => K.cylinder(cx, cy, r, z, h, P, steps, bevel)
  const line = (d: string, tone: K.LineTone = 'lo', o: Partial<K.LineStyle> = {}) => K.lineSvg(d, { tone, ...o })
  const dots = (pts: Point3[], size = 0.55, tone: K.Tone = 'mid') => K.dotsSvg(K.pointsAt(pts, P), { size, tone })
  const foot = (x: number, y: number, s = 14) => {
    const f: Plan = { x: x - s / 2, y: y - s / 2, w: s, d: s, r: 1.4 }
    return solid(slab(f, BZ, 2.5, 3, 0.4), { tone: 'mid' }) + K.corners(f, 2.4).map(([a, b]) => dots([[a, b, BZ + 2.5]], 0.42, 'mid')).join('')
  }
  const crateAt = (x: number, y: number, z: number, w = 14, d = 12, h = 9, lit = false, tone: K.Tone = 'hi') => {
    const p: Plan = { x: x - w / 2, y: y - d / 2, w, d, r: 0.6 }
    return solid(slab(p, z, h, 2, 0.3), { tone, lit, inner: line(K.lineOnTop([p.x + 2, y], [p.x + w - 2, y], z + h, P), 'faint') })
  }

  /* ---------- base and track ---------- */
  const base = (() => {
    const out: string[] = []
    for (const [x, y] of K.corners(BASE, 16)) out.push(solid(cyl(x, y, 8, -8, 8, 24), { tone: 'mid' }))
    out.push(solid(slab(BASE, 0, BZ, 9, 1.2), { tone: 'hi', halo: true, inner: line(K.sideSeam(BASE, BZ * 0.45, P, 9), 'faint') }))
    out.push(line(K.planOutline(K.insetPlan(BASE, 7), BZ, P, 8), 'faint'))
    for (const [x, y] of K.corners(BASE, 13)) out.push(line(K.ring(x, y, 1.6, BZ, P, 14), 'lo'), dots([[x, y, BZ]], 0.6, 'hi'))
    // station dividers engraved on the base top, one tick number per station
    for (let i = 1; i < n; i++) out.push(line(K.lineOnTop([x0(i), 10], [x0(i), D - 10], BZ, P), 'faint', { dashed: true }))
    // ruler strip
    const strip: Plan = { x: 28, y: D - 28, w: n * STEP, d: 10, r: 0 }
    out.push(solid(slab(strip, BZ, 0.8, 2), { tone: 'mid', flat: true }))
    const t = K.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y, BZ + 0.8, [2.5, 5], P)
    out.push(line(t.minor, 'lo'), line(t.major, 'mid'))
    // name plate
    const plate: Plan = { x: BASE.w - 118, y: D - 46, w: 96, d: 14, r: 1.2 }
    out.push(solid(slab(plate, BZ, 1, 3, 0.4), { tone: 'mid' }))
    for (const [x, y] of K.corners(plate, 2.6)) out.push(dots([[x, y, BZ + 1]], 0.4, 'mid'))
    out.push(K.faceTextSvg(K.topMatrix([plate.x + 6, plate.y + 9], BZ + 1, P), c.name.toUpperCase(), { size: 5.2, tone: 'hi' }))
    // track with guide rails and end stops
    const track: Plan = { x: 16, y: TRACK_Y0, w: BASE.w - 32, d: TRACK_D, r: 2 }
    out.push(solid(slab(track, BZ, 4, 3, 0.5), { tone: 'hi' }))
    for (const y of [TRACK_Y0 + 3, TRACK_Y0 + TRACK_D - 3]) out.push(line(K.lineOnTop([track.x + 6, y], [track.x + track.w - 6, y], TZ, P), 'faint'))
    for (const x of [track.x + 3, track.x + track.w - 7]) out.push(solid(slab({ x, y: TRACK_Y0 + 1, w: 4, d: TRACK_D - 2, r: 0.6 }, TZ, 3, 2), { tone: 'mid' }))
    // rollers: small rings along the track
    for (let x = track.x + 14; x < track.x + track.w - 10; x += 12) out.push(line(K.lineOnTop([x, TRACK_Y0 + 5], [x, TRACK_Y0 + TRACK_D - 5], TZ, P), 'faint'))
    return out.join('')
  })()

  /* ---------- station kinds ---------- */
  const kinds: Record<PartKind, (i: number) => { back: (lit: boolean) => string; front: (lit: boolean) => string }> = {
    // A gate over the track: two posts, a beam and a hanging grate; a reject bin behind with one crate turned away.
    gate: (i) => {
      const x = mid(i)
      const back = (lit: boolean) => {
        const out: string[] = []
        // reject bin behind the track
        const bin: Plan = { x: x - 26, y: 22, w: 34, d: 40, r: 1.2 }
        out.push(solid(slab(bin, BZ, 4, 3, 0.4), { tone: 'mid' }))
        out.push(solid(slab({ x: bin.x, y: bin.y, w: bin.w, d: 3, r: 0.4 }, BZ + 4, 14, 2), { tone: 'mid' }))
        out.push(solid(slab({ x: bin.x, y: bin.y, w: 3, d: bin.d, r: 0.4 }, BZ + 4, 14, 2), { tone: 'mid' }))
        out.push(crateAt(x - 12, 40, BZ + 4, 13, 12, 8, false, 'mid'))
        out.push(line(K.lineOnTop([x - 17, 36], [x - 7, 44], BZ + 12, P), 'hi'), line(K.lineOnTop([x - 7, 36], [x - 17, 44], BZ + 12, P), 'hi'))
        out.push(solid(slab({ x: bin.x + bin.w - 3, y: bin.y, w: 3, d: bin.d, r: 0.4 }, BZ + 4, 10, 2), { tone: 'mid' }))
        out.push(solid(slab({ x: bin.x, y: bin.y + bin.d - 3, w: bin.w, d: 3, r: 0.4 }, BZ + 4, 10, 2), { tone: 'mid' }))
        // back post
        out.push(foot(x + 14, TRACK_Y0 - 12), solid(cyl(x + 14, TRACK_Y0 - 12, 3.6, BZ + 2.5, 82, 22), { tone: 'hi' }))
        // inbound slips waiting on the first rollers (from "the internet")
        void lit
        return out.join('')
      }
      const front = (lit: boolean) => {
        const out: string[] = []
        out.push(foot(x + 14, TRACK_Y0 + TRACK_D + 12), solid(cyl(x + 14, TRACK_Y0 + TRACK_D + 12, 3.6, BZ + 2.5, 82, 22), { tone: 'hi' }))
        const beam: Plan = { x: x + 8, y: TRACK_Y0 - 20, w: 12, d: TRACK_D + 40, r: 1.2 }
        out.push(solid(slab(beam, BZ + 84, 9, 3, 0.6), { tone: 'hi', inner: line(K.sideSeam(beam, BZ + 88, P, 3), 'faint') }))
        // the grate: a thin plate hanging from the beam with vertical bars
        const grate: Plan = { x: x + 12, y: TRACK_Y0 + 1, w: 3, d: TRACK_D - 2, r: 0.3 }
        out.push(solid(slab(grate, BZ + 30, 54, 2), { tone: 'hi', lit, inner: [0, 1, 2, 3, 4].map((k) => line(K.segment([x + 12, TRACK_Y0 + 4 + k * 4, BZ + 32], [x + 12, TRACK_Y0 + 4 + k * 4, BZ + 82], P), 'mid')).join('') }))
        out.push(dots([[x + 14, TRACK_Y0 - 14, BZ + 93], [x + 14, TRACK_Y0 + TRACK_D + 14, BZ + 93]], 0.5, 'hi'))
        return out.join('')
      }
      return { back, front }
    },
    // A shelving rack behind the track: four posts, three shelves, crates labelled with version ticks.
    rack: (i) => {
      const x = x0(i) + 10
      const w = STEP - 20
      const back = (lit: boolean) => {
        const out: string[] = []
        const y = 18
        const d = 50
        for (const [px, py] of [[x, y], [x + w, y]] as [number, number][]) out.push(solid(slab({ x: px - 2, y: py, w: 4, d: 4, r: 0.4 }, BZ, 76, 2), { tone: 'hi' }))
        for (let s = 0; s < 3; s++) {
          const z = BZ + 4 + s * 26
          out.push(solid(slab({ x, y, w, d, r: 0.8 }, z, 3, 3, 0.3), { tone: 'hi' }))
          for (let k = 0; k < 4; k++) {
            const cx = x + 12 + k * 20
            out.push(crateAt(cx, y + 24, z + 3, 15, 22, 11 + ((k + s) % 3) * 2, lit && s === 2, 'hi'))
            out.push(K.faceTextSvg(K.sideMatrix([cx - 6, y + 35], z + 9, P, 'left'), `v${s + 1}.${k}`, { size: 3.6, tone: 'mid' }))
          }
        }
        out.push(solid(slab({ x, y, w, d, r: 0.8 }, BZ + 82, 3, 3, 0.3), { tone: 'hi' }))
        for (const [px, py] of [[x, y + d - 4], [x + w, y + d - 4]] as [number, number][]) out.push(solid(slab({ x: px - 2, y: py, w: 4, d: 4, r: 0.4 }, BZ, 85, 2), { tone: 'hi' }))
        return out.join('')
      }
      // a short feeder arm from the track up to the rack
      const front = () => solid(slab({ x: mid(i) - 4, y: 70, w: 8, d: TRACK_Y0 - 70, r: 0.6 }, BZ, 3, 2), { tone: 'mid' })
      return { back, front }
    },
    // An arch over the track: two pillars and a housing with a beam window, plus a small readout on a stand.
    scanner: (i) => {
      const x = mid(i)
      const back = () => solid(slab({ x: x - 16, y: TRACK_Y0 - 16, w: 32, d: 12, r: 1.2 }, BZ, 70, 3, 0.6), { tone: 'hi', inner: line(K.sideSeam({ x: x - 16, y: TRACK_Y0 - 16, w: 32, d: 12, r: 1.2 }, BZ + 60, P, 3), 'faint') })
      const front = (lit: boolean) => {
        const out: string[] = []
        const housing: Plan = { x: x - 18, y: TRACK_Y0 - 18, w: 36, d: TRACK_D + 36, r: 2 }
        out.push(solid(slab(housing, BZ + 70, 16, 4, 0.8), { tone: 'hi', lit, inner: line(K.sideSeam(housing, BZ + 78, P, 4), 'faint') }))
        // beam: dotted lines down to the track
        for (let k = 0; k < 4; k++) out.push(line(K.segment([x - 6 + k * 4, TY, BZ + 70], [x - 6 + k * 4, TY, TZ + 10], P), 'mid', { dotted: true }))
        out.push(solid(slab({ x: x - 16, y: TRACK_Y0 + TRACK_D + 4, w: 32, d: 12, r: 1.2 }, BZ, 70, 3, 0.6), { tone: 'hi' }))
        // readout on a stand in front
        const sx = x + 26
        const sy = TRACK_Y0 + TRACK_D + 34
        out.push(foot(sx, sy, 12), solid(cyl(sx, sy, 1.6, BZ + 2.5, 24, 12), { tone: 'hi' }))
        const screen: Plan = { x: sx - 12, y: sy - 2, w: 24, d: 4, r: 0.5 }
        out.push(solid(slab(screen, BZ + 26, 16, 2, 0.3), { tone: 'hi' }))
        for (let k = 0; k < 4; k++) out.push(line(K.segment([sx - 9 + k * 4, sy + 2, BZ + 30], [sx - 9 + k * 4, sy + 2, BZ + 30 + 3 + ((k * 5) % 7)], P), k === 1 ? 'hi' : 'mid'))
        return out.join('')
      }
      return { back, front }
    },
    // A dock behind the track: a sealed bundle on a platform; three rails fan out toward the front.
    dock: (i) => {
      const x = mid(i)
      const back = (lit: boolean) => {
        const out: string[] = []
        const pf: Plan = { x: x - 30, y: 24, w: 60, d: 50, r: 1.5 }
        out.push(solid(slab(pf, BZ, 6, 3, 0.6), { tone: 'hi', inner: line(K.sideSeam(pf, BZ + 3, P, 3), 'faint') }))
        const box: Plan = { x: x - 16, y: 34, w: 32, d: 28, r: 0.8 }
        out.push(solid(slab(box, BZ + 6, 22, 3, 0.5), { tone: 'hi', lit, inner: line(K.lineOnTop([x, 34], [x, 62], BZ + 28, P), 'mid') + line(K.lineOnTop([x - 16, 48], [x + 16, 48], BZ + 28, P), 'mid') }))
        out.push(dots([[x, 48, BZ + 28]], 0.8, 'hi'))
        return out.join('')
      }
      const front = () => {
        const out: string[] = []
        // three outbound rails toward the front edge, each with a small crate
        for (let k = -1; k <= 1; k++) {
          const ex = x + k * 26
          out.push(line(K.lineOnTop([x + k * 4, TRACK_Y0 + TRACK_D + 2], [ex, D - 34], BZ, P), 'mid'))
          out.push(line(K.lineOnTop([x + k * 4 + 4, TRACK_Y0 + TRACK_D + 2], [ex + 4, D - 34], BZ, P), 'mid'))
          out.push(crateAt(ex + 2, D - 44 + Math.abs(k) * 4, BZ, 10, 9, 7, false, 'mid'))
        }
        return out.join('')
      }
      return { back, front }
    },
    // A plate of pods (short cylinders) with a dial gauge per cluster.
    cluster: (i) => {
      const x = mid(i)
      const back = (lit: boolean) => {
        const out: string[] = []
        const plate: Plan = { x: x - 34, y: 20, w: 68, d: 56, r: 2 }
        out.push(solid(slab(plate, BZ, 4, 3, 0.5), { tone: 'hi' }))
        for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) {
          const px = x - 24 + q * 16
          const py = 30 + r * 16
          out.push(solid(cyl(px, py, 5, BZ + 4, 10 + ((q + r) % 2) * 6, 18, 0.4), { tone: 'hi', lit: lit && r === 1 && q === 2 }))
          out.push(dots([[px, py, BZ + 14 + ((q + r) % 2) * 6]], 0.5, 'mid'))
        }
        return out.join('')
      }
      const front = () => {
        const out: string[] = []
        const gx = x + 30
        const gy = TRACK_Y0 + TRACK_D + 30
        out.push(solid(cyl(gx, gy, 10, BZ, 4, 32, 0.4), { tone: 'hi' }))
        const t = K.radialTicks(gx, gy, 8.5, 24, 6, BZ + 4, [1, 2.2], P)
        out.push(line(t.minor, 'lo'), line(t.major, 'mid'))
        out.push(line(K.lineOnTop([gx, gy], [gx + 5, gy - 5], BZ + 4.2, P), 'lit', { free: true }), dots([[gx, gy, BZ + 4.2]], 0.8, 'hi'))
        return out.join('')
      }
      return { back, front }
    },
    // A bar of small devices, each with an antenna rod and a tip.
    devices: (i) => {
      const x = mid(i)
      const back = (lit: boolean) => {
        const out: string[] = []
        const bar: Plan = { x: x - 36, y: 30, w: 72, d: 22, r: 1.5 }
        out.push(solid(slab(bar, BZ, 6, 3, 0.5), { tone: 'hi' }))
        for (let k = 0; k < 4; k++) {
          const dx = x - 27 + k * 18
          const dev: Plan = { x: dx - 6, y: 35, w: 12, d: 12, r: 1 }
          out.push(solid(slab(dev, BZ + 6, 8, 3, 0.4), { tone: 'hi', lit: lit && k === 1 }))
          out.push(solid(cyl(dx + 3, 38, 0.9, BZ + 14, 30 + (k % 2) * 10, 8), { tone: 'hi' }))
          out.push(dots([[dx + 3, 38, BZ + 44 + (k % 2) * 10]], 1.1, 'hi'))
          out.push(dots([[dx - 2, 47, BZ + 14]], 0.5, 'mid'))
        }
        return out.join('')
      }
      // signal rings above the antennas
      const front = () => [0, 1].map((k) => line(K.ring(x - 6, 38, 6 + k * 6, BZ + 58, P, 28), 'faint', { dashed: true })).join('')
      return { back, front }
    },
  }

  const stations = c.parts.map((p, i) => ({ id: p.id, ...kinds[p.kind ?? "rack"](i) }))
  const stops = c.parts.map((_, i) => mid(i))
  const crate = crateAt(0, TY, TZ, 14, 12, 9, true)

  const box = (i: number) => {
    const pts: Point3[] = []
    for (const x of [x0(i) - 4, x0(i) + STEP + 4]) for (const y of [10, D - 10]) for (const z of [BZ, BZ + TOP[c.parts[i].kind ?? "rack"] + 6]) pts.push([x, y, z])
    const f = K.pointsAt(pts, P)
    const xs = f.map((q) => q[0])
    const ys = f.map((q) => q[1])
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
  }
  const hit = (i: number) => {
    const pts: Point3[] = []
    for (const x of [x0(i), x0(i) + STEP]) for (const y of [0, D]) for (const z of [-8, BZ + TOP[c.parts[i].kind ?? "rack"]]) pts.push([x, y, z])
    return hull(K.pointsAt(pts, P)).map((q) => q.join(',')).join(' ')
  }
  return { P, base, stations, crate, stops, startX: 24, endX: BASE.w - 24, box, hit, moveBy: (d) => K.translateAlong(P, d) }
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
