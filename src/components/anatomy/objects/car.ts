// Tesla, as its most talked-about product: an electric car taken apart.
// Bottom to top: the drive platform (motors, wheels), the structural battery pack, the self-driving computer,
// the body, and the glass roof with its cameras. Layer ids match the parts in data/companies.ts.
import type { Plan } from '../../iso/iso-kit'
import * as K from '../../iso/iso-kit'
import { explode, type LayerSpec } from '../exploded'

const FOOT: Plan = { x: 0, y: -4, w: 184, d: 92, r: 6 }
const PACK: Plan = { x: 34, y: 12, w: 112, d: 60, r: 3 }
const FSD: Plan = { x: 58, y: 30, w: 26, d: 22, r: 1 }
// side profile of the body, front (x = 0) to back
const BODY: [number, number][] = [
  [4, 14], [176, 14], [181, 24], [180, 38], [164, 44], [140, 58], [104, 62], [80, 60], [56, 42], [12, 36], [3, 28],
]
const GLASS: [number, number][] = [[80, 60.2], [104, 62.2], [140, 58.2], [141, 60.4], [104, 64.4], [79, 62.4]]
const WHEELS = [36, 146]

export const CAR_LAYERS: LayerSpec[] = [
  { id: 'drive', plan: { x: 8, y: -2, w: 168, d: 88, r: 2 }, z0: 0, top: 31, lift: 0 },
  { id: 'battery', plan: PACK, z0: 14, top: 22, lift: 44 },
  { id: 'computer', plan: FSD, z0: 30, top: 37, lift: 96 },
  { id: 'body', plan: { x: 2, y: 6, w: 180, d: 72, r: 2 }, z0: 14, top: 62, lift: 176 },
  { id: 'wheels', plan: { x: 8, y: 74, w: 168, d: 10, r: 2 }, z0: 0, top: 31, lift: 0, follow: 'drive' },
  { id: 'glass', plan: { x: 78, y: 12, w: 64, d: 60, r: 2 }, z0: 58, top: 65, lift: 226 },
]

export const buildCar = () =>
  explode(FOOT, CAR_LAYERS, ({ solid, slab, cyl, line, dots, top, text, prismY, disc, byDepth }, P) => {
    const wheel = (x: number, y0: number, y1: number, lit: boolean) => {
      const out: string[] = []
      out.push(solid(prismY(disc(x, 15, 15, 24), y0, y1), { tone: 'hi', lit }))
      // hub and spokes on the outer face
      const hub = (r: number) => K.pathOf(disc(x, 15, r, 20).map(([px, pz]) => K.iso([px, y1, pz], P)), true)
      out.push(line(hub(10), 'mid'), line(hub(4), 'mid'))
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2
        out.push(line(K.segment([x + Math.cos(a) * 4, y1, 15 + Math.sin(a) * 4], [x + Math.cos(a) * 10, y1, 15 + Math.sin(a) * 10], P), 'faint'))
      }
      out.push(dots([[x, y1, 15]], 0.8, 'hi'))
      return out.join('')
    }
    return {
      drive: (lit) => {
        const out: string[] = []
        // far wheels first, then the frame rails, axles and the two drive units
        for (const x of WHEELS) out.push(wheel(x, -2, 8, false))
        for (const x of WHEELS) out.push(solid(cyl(x, 40, 2.4, 14, 1, 10), { tone: 'mid' }), line(K.segment([x, 8, 15], [x, 74, 15], P), 'mid'))
        for (const y of [16, 64]) out.push(solid(slab({ x: 14, y, w: 156, d: 6, r: 1 }, 10, 4, 2, 0.4), { tone: 'hi' }))
        for (const x of WHEELS) {
          const unit: Plan = { x: x - 12, y: 30, w: 24, d: 22, r: 3 }
          out.push(solid(slab(unit, 8, 14, 4, 0.8), { tone: 'hi', lit, inner: line(K.sideSeam(unit, 15, P, 4), 'faint') }))
          out.push(solid(cyl(x, 41, 6, 22, 2, 18, 0.3), { tone: 'mid', lit }))
          out.push(text([x - 8, 47], 22, 'MOTOR', 3.6, 'mid'))
        }
        return out.join('')
      },
      battery: (lit) => {
        const out: string[] = []
        out.push(solid(slab(PACK, 14, 8, 4, 0.8), { tone: 'hi', lit }))
        // modules and cell tops
        for (let k = 1; k < 4; k++) out.push(line(top([PACK.x + k * 28, PACK.y + 3], [PACK.x + k * 28, PACK.y + PACK.d - 3], 22), 'faint'))
        out.push(line(top([PACK.x + 3, PACK.y + 30], [PACK.x + PACK.w - 3, PACK.y + 30], 22), 'faint'))
        const cells: [number, number, number][] = []
        for (let i = 0; i < 4; i++) for (let a = 0; a < 4; a++) for (let b = 0; b < 2; b++) for (let r = 0; r < 3; r++) cells.push([PACK.x + 6 + i * 28 + a * 6, PACK.y + 6 + b * 30 + r * 8, 22])
        out.push(dots(cells, 1.2, 'mid'))
        out.push(text([PACK.x + 6, PACK.y + PACK.d - 6], 22, 'STRUCTURAL PACK', 4.2, 'mid'))
        return out.join('')
      },
      computer: (lit) => {
        const out: string[] = []
        const fins = [0, 1, 2, 3, 4, 5].map((k) => line(top([FSD.x + 3 + k * 4, FSD.y + 3], [FSD.x + 3 + k * 4, FSD.y + FSD.d - 3], 37), 'faint')).join('')
        out.push(solid(slab(FSD, 30, 7, 3, 0.4), { tone: 'hi', lit, inner: fins }))
        // two cables back to the cameras
        out.push(line(K.segment([FSD.x + FSD.w, FSD.y + 6, 33], [FSD.x + FSD.w + 12, FSD.y + 2, 33], P), 'mid'), line(K.segment([FSD.x + FSD.w, FSD.y + 16, 33], [FSD.x + FSD.w + 12, FSD.y + 20, 33], P), 'mid'))
        out.push(dots([[FSD.x + FSD.w + 12, FSD.y + 2, 33], [FSD.x + FSD.w + 12, FSD.y + 20, 33]], 0.9, 'hi'))
        return out.join('')
      },
      body: (lit) => {
        const out: string[] = []
        const shell = prismY(BODY, 6, 78)
        // door seams and the window line on the near side
        const seams = [
          K.segment([58, 78, 18], [58, 78, 41], P),
          K.segment([102, 78, 18], [102, 78, 58], P),
          K.segment([142, 78, 18], [142, 78, 50], P),
          K.pathOf([[60, 43], [82, 58], [138, 56.5], [160, 45], [60, 43]].map(([x, z]) => K.iso([x, 78, z], P))),
        ]
        out.push(solid(shell, { tone: 'hi', lit, inner: seams.map((d) => line(d, 'faint')).join('') + line(K.segment([66, 78, 34], [72, 78, 34], P), 'mid') + line(K.segment([110, 78, 34], [116, 78, 34], P), 'mid') }))
        // headlight bar across the nose
        out.push(line(K.segment([3.5, 10, 29], [3.5, 74, 29], P), 'hi'))
        return out.join('')
      },
      wheels: (lit) => WHEELS.map((x) => wheel(x, 76, 86, lit)).join(''),
      glass: (lit) => {
        const out: string[] = []
        out.push(solid(prismY(GLASS, 14, 70), { tone: 'hi', lit }))
        // cameras: one at the top of the windshield, two on the pillars
        const cams: [number, number, number][] = [[81, 40, 62.6], [104, 16, 64.6], [104, 68, 64.6]]
        for (const c of byDepth(cams, (c) => c)) out.push(dots([c], 1.4, 'hi'))
        return out.join('')
      },
    }
  }, { azimuth: 30, elevation: 28 })
