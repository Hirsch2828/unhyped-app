// Apple, as its most talked-about product: an iPhone-style phone taken apart, lying screen up.
// Bottom to top: back glass with the magnet ring, the camera module, the battery, the logic board with Apple's chip,
// the frame, and the display. Layer ids match the parts in data/companies.ts.
import type { Plan } from '../../iso/iso-kit'
import * as K from '../../iso/iso-kit'
import { explode, type LayerSpec } from '../exploded'

const PH: Plan = { x: 0, y: 0, w: 72, d: 148, r: 11 }
const CAM: Plan = { x: 6, y: 6, w: 30, d: 30, r: 7 }
const BAT: Plan = { x: 12, y: 58, w: 48, d: 76, r: 4 }
const BOARD: Plan = { x: 40, y: 6, w: 26, d: 46, r: 3 }
const CHIP: Plan = { x: 45, y: 14, w: 16, d: 16, r: 1.5 }

export const PHONE_LAYERS: LayerSpec[] = [
  { id: 'back', plan: PH, z0: 0, top: 2, lift: 0 },
  { id: 'cameras', plan: CAM, z0: 2, top: 12, lift: 40, move: [-30, -50, 40] },
  { id: 'battery', plan: BAT, z0: 2, top: 6, lift: 78 },
  { id: 'chip', plan: BOARD, z0: 2, top: 6, lift: 116 },
  { id: 'frame', plan: PH, z0: 0, top: 9, lift: 160 },
  { id: 'display', plan: PH, z0: 9, top: 11, lift: 212 },
]

export const buildPhone = () =>
  explode(PH, PHONE_LAYERS, ({ solid, slab, cyl, line, dots, top, text, byDepth }, P) => ({
    back: (lit) => {
      const out: string[] = []
      out.push(solid(slab(PH, 0, 2, 8, 0.6), { tone: 'hi', lit, halo: true }))
      // the magnet ring for MagSafe, and its alignment notch
      out.push(line(K.ring(36, 84, 22, 2, P, 48), 'mid'), line(K.ring(36, 84, 19, 2, P, 48), 'faint'), line(top([36, 108], [36, 114], 2), 'mid'))
      out.push(line(K.planOutline({ x: CAM.x - 1, y: CAM.y - 1, w: CAM.w + 2, d: CAM.d + 2, r: 8 }, 2, P, 6), 'faint', { dashed: true }))
      return out.join('')
    },
    cameras: (lit) => {
      const out: string[] = []
      out.push(solid(slab(CAM, 2, 3, 6, 0.6), { tone: 'hi', lit }))
      const lenses: [number, number][] = [[14, 14], [28, 21], [14, 28]]
      for (const [x, y] of byDepth(lenses, ([x, y]) => [x, y, 5])) {
        out.push(solid(cyl(x, y, 5.5, 5, 6, 24, 0.4), { tone: 'hi', lit }))
        out.push(line(K.ring(x, y, 3.4, 11, P, 20), 'mid'), dots([[x, y, 11]], 0.9, 'hi'))
      }
      out.push(dots([[29, 10, 5], [29, 31, 5]], 0.8, 'mid'))
      return out.join('')
    },
    battery: (lit) => {
      const out: string[] = []
      out.push(solid(slab(BAT, 2, 4, 4, 0.6), { tone: 'hi', lit, inner: line(K.planOutline(K.insetPlan(BAT, 4), 6, P, 3), 'faint') }))
      out.push(text([BAT.x + 8, BAT.y + 40], 6, 'BATTERY', 5.5, 'mid', 'y'))
      // the flex cable to the board
      out.push(solid(slab({ x: 48, y: 50, w: 6, d: 10, r: 0.5 }, 6, 0.6, 2), { tone: 'mid', flat: true }))
      return out.join('')
    },
    chip: (lit) => {
      const out: string[] = []
      out.push(solid(slab(BOARD, 2, 2, 3, 0.3), { tone: 'mid' }))
      for (let k = 0; k < 4; k++) out.push(line(top([BOARD.x + 3, 36 + k * 4], [BOARD.x + BOARD.w - 3, 36 + k * 4], 4), 'faint'))
      out.push(solid(slab(CHIP, 4, 2, 2, 0.3), { tone: 'hi', lit: true, inner: line(K.planOutline(K.insetPlan(CHIP, 3), 6, P, 2), 'faint') }))
      out.push(text([CHIP.x + 3, CHIP.y + 10], 6, 'SoC', 4.5, 'hi'))
      const parts: [number, number, number][] = [[44, 36, 4], [52, 40, 4], [60, 36, 4], [58, 46, 4]]
      for (const p of parts) out.push(solid(slab({ x: p[0] - 2, y: p[1] - 2, w: 4, d: 3, r: 0.4 }, 4, 1.4, 2), { tone: 'hi' }))
      void lit
      return out.join('')
    },
    frame: (lit) => {
      const out: string[] = []
      // four rails and rounded corner posts, painted far to near
      const bars: Plan[] = [
        { x: 8, y: 0, w: 56, d: 3, r: 1 },
        { x: 0, y: 8, w: 3, d: 132, r: 1 },
        { x: 69, y: 8, w: 3, d: 132, r: 1 },
        { x: 8, y: 145, w: 56, d: 3, r: 1 },
      ]
      const posts: [number, number][] = [[8, 8], [64, 8], [8, 140], [64, 140]]
      const items: { at: [number, number, number]; svg: () => string }[] = [
        ...bars.map((b) => ({ at: [b.x + b.w / 2, b.y + b.d / 2, 4] as [number, number, number], svg: () => solid(slab(b, 0, 9, 2, 0.4), { tone: 'hi', lit }) })),
        ...posts.map(([x, y]) => ({ at: [x, y, 4] as [number, number, number], svg: () => solid(cyl(x, y, 8, 0, 9, 24, 0.4), { tone: 'hi', lit }) })),
      ]
      for (const it of byDepth(items, (i) => i.at)) out.push(it.svg())
      // side buttons
      for (const [y, d] of [[34, 14], [52, 10], [66, 10]] as [number, number][]) out.push(solid(slab({ x: -1.2, y, w: 1.4, d, r: 0.5 }, 3, 3, 2), { tone: 'mid' }))
      return out.join('')
    },
    display: (lit) => {
      const out: string[] = []
      const screen = K.insetPlan(PH, 3)
      out.push(solid(slab(PH, 9, 2, 8, 0.8), { tone: 'hi', lit, inner: line(K.planOutline(screen, 11, P, 6), 'faint') }))
      // the island at the top of the screen
      out.push(solid(slab({ x: 25, y: 9, w: 22, d: 7, r: 3.5 }, 11, 0.4, 4), { tone: 'mid', flat: true }))
      // a few app tiles, faint, so it reads as a screen
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) out.push(line(K.planOutline({ x: 10 + c * 14, y: 26 + r * 16, w: 9, d: 9, r: 2.5 }, 11, P, 3), 'faint'))
      return out.join('')
    },
  }), { azimuth: 52, elevation: 30 })
