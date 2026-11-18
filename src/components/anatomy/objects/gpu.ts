// Nvidia, as its most talked-about product: a data-centre GPU module taken apart.
// Bottom to top: the board with power stages, the package substrate, the memory stacks on their interposer,
// the two compute dies, the lid, and the cooler. Layer ids match the parts in data/companies.ts.
import type { Plan } from '../../iso/iso-kit'
import { explode, type LayerSpec } from '../exploded'

const BOARD: Plan = { x: 0, y: 0, w: 260, d: 170, r: 4 }
const SUB: Plan = { x: 70, y: 35, w: 120, d: 100, r: 2 }
const INT: Plan = { x: 80, y: 45, w: 100, d: 80, r: 1 }
const DIES: Plan = { x: 104, y: 57, w: 52, d: 56, r: 0.5 }
const LID: Plan = { x: 72, y: 37, w: 116, d: 96, r: 3 }
const COOL: Plan = { x: 20, y: 10, w: 220, d: 150, r: 3 }

export const GPU_LAYERS: LayerSpec[] = [
  { id: 'board', plan: BOARD, z0: 0, top: 14, lift: 0 },
  { id: 'substrate', plan: SUB, z0: 4, top: 8, lift: 34 },
  { id: 'memory', plan: INT, z0: 8, top: 20, lift: 66 },
  { id: 'die', plan: DIES, z0: 10, top: 14, lift: 104 },
  { id: 'lid', plan: LID, z0: 20, top: 25, lift: 140 },
  { id: 'cooling', plan: COOL, z0: 25, top: 61, lift: 214 },
]

export const buildGpu = () =>
  explode(BOARD, GPU_LAYERS, ({ solid, slab, cyl, line, dots, top, text, byDepth }) => ({
    board: (lit) => {
      const out: string[] = []
      out.push(solid(slab(BOARD, 0, 4, 6, 0.8), { tone: 'hi', lit, halo: true }))
      // copper traces running from the power stages to the package
      for (let k = 0; k < 6; k++) {
        const y = 44 + k * 16
        out.push(line(top([36, y], [62, y], 4) + top([62, y], [70, y + (k < 3 ? 6 : -6)], 4), 'faint'))
      }
      for (let k = 0; k < 5; k++) out.push(line(top([196, 50 + k * 18], [236, 50 + k * 18], 4), 'faint'))
      // mounting holes
      for (const [x, y] of [[10, 10], [250, 10], [10, 160], [250, 160]] as [number, number][]) out.push(line(top([x - 3, y], [x + 3, y], 4), 'faint'), dots([[x, y, 4]], 0.7, 'mid'))
      // capacitors along the back edge
      const caps = Array.from({ length: 14 }, (_, k) => [44 + k * 13, 14] as [number, number])
      for (const [x, y] of byDepth(caps, ([x, y]) => [x, y, 4])) out.push(solid(cyl(x, y, 3.4, 4, 7, 14, 0.3), { tone: 'mid' }), dots([[x, y, 11]], 0.4, 'mid'))
      // power stages (chokes) down the left side
      const chokes = Array.from({ length: 7 }, (_, k) => [14, 34 + k * 16] as [number, number])
      for (const [x, y] of byDepth(chokes, ([x, y]) => [x, y, 4])) {
        const p: Plan = { x: x - 6, y: y - 6, w: 12, d: 12, r: 1 }
        out.push(solid(slab(p, 4, 8, 3, 0.4), { tone: 'hi' }), line(top([x - 3, y], [x + 3, y], 12), 'faint'))
      }
      // the connector fingers along the front edge
      for (let x = 60; x <= 200; x += 4) out.push(line(top([x, 160], [x, 168], 4), 'mid'))
      out.push(line(top([56, 158], [204, 158], 4), 'lo'))
      // the socket outline where the package sits
      out.push(line(top([SUB.x - 3, SUB.y - 3], [SUB.x + SUB.w + 3, SUB.y - 3], 4) + top([SUB.x + SUB.w + 3, SUB.y - 3], [SUB.x + SUB.w + 3, SUB.y + SUB.d + 3], 4) + top([SUB.x + SUB.w + 3, SUB.y + SUB.d + 3], [SUB.x - 3, SUB.y + SUB.d + 3], 4) + top([SUB.x - 3, SUB.y + SUB.d + 3], [SUB.x - 3, SUB.y - 3], 4), 'mid', { dashed: true }))
      out.push(text([206, 140], 4, 'SXM MODULE', 5, 'mid'))
      return out.join('')
    },
    substrate: (lit) => {
      const out: string[] = []
      out.push(solid(slab(SUB, 4, 4, 4, 0.5), { tone: 'hi', lit }))
      // decoupling capacitors around the edge of the package
      const pts: [number, number, number][] = []
      for (let x = SUB.x + 6; x <= SUB.x + SUB.w - 6; x += 6) pts.push([x, SUB.y + 5, 8], [x, SUB.y + SUB.d - 5, 8])
      for (let y = SUB.y + 11; y <= SUB.y + SUB.d - 11; y += 6) pts.push([SUB.x + 5, y, 8], [SUB.x + SUB.w - 5, y, 8])
      out.push(dots(pts, 0.6, 'mid'))
      return out.join('')
    },
    memory: (lit) => {
      const out: string[] = []
      out.push(solid(slab(INT, 8, 2, 3, 0.3), { tone: 'mid' }))
      const stacks: Plan[] = []
      for (const x of [84, 160]) for (let k = 0; k < 4; k++) stacks.push({ x, y: 48 + k * 19, w: 16, d: 17, r: 0.6 })
      for (const p of byDepth(stacks, (p) => [p.x + p.w / 2, p.y + p.d / 2, 10])) {
        const seams = [12, 14, 16, 18].map((z) => line(top([p.x + 1, p.y + p.d], [p.x + p.w - 1, p.y + p.d], z) + top([p.x + p.w, p.y + 1], [p.x + p.w, p.y + p.d - 1], z), 'faint')).join('')
        out.push(solid(slab(p, 10, 10, 3, 0.3), { tone: 'hi', lit, inner: seams }))
      }
      return out.join('')
    },
    die: (lit) => {
      const out: string[] = []
      for (const x of [DIES.x, DIES.x + 28]) {
        const p: Plan = { x, y: DIES.y, w: 24, d: DIES.d, r: 0.5 }
        const grid: string[] = []
        for (let k = 1; k < 6; k++) grid.push(line(top([x + 2, DIES.y + k * 9.3], [x + 22, DIES.y + k * 9.3], 14), 'faint'))
        for (let k = 1; k < 3; k++) grid.push(line(top([x + k * 8, DIES.y + 2], [x + k * 8, DIES.y + DIES.d - 2], 14), 'faint'))
        out.push(solid(slab(p, 10, 4, 2, 0.3), { tone: 'hi', lit, inner: grid.join('') }))
      }
      // the bridge that joins the two dies into one GPU
      out.push(solid(slab({ x: DIES.x + 23, y: DIES.y + 16, w: 6, d: 24, r: 0.4 }, 14, 1, 2), { tone: 'mid', lit }))
      return out.join('')
    },
    lid: (lit) => {
      const out: string[] = []
      const inset: Plan = { x: LID.x + 10, y: LID.y + 10, w: LID.w - 20, d: LID.d - 20, r: 2 }
      out.push(solid(slab(LID, 20, 5, 6, 1), { tone: 'hi', lit, inner: line(top([inset.x, inset.y], [inset.x + inset.w, inset.y], 25) + top([inset.x + inset.w, inset.y], [inset.x + inset.w, inset.y + inset.d], 25) + top([inset.x + inset.w, inset.y + inset.d], [inset.x, inset.y + inset.d], 25) + top([inset.x, inset.y + inset.d], [inset.x, inset.y], 25), 'faint') }))
      out.push(text([LID.x + 18, LID.y + 52], 25, 'GPU', 12, 'hi'))
      out.push(dots([[LID.x + 5, LID.y + 5, 25], [LID.x + LID.w - 5, LID.y + 5, 25], [LID.x + 5, LID.y + LID.d - 5, 25], [LID.x + LID.w - 5, LID.y + LID.d - 5, 25]], 0.6, 'mid'))
      return out.join('')
    },
    cooling: (lit) => {
      const out: string[] = []
      out.push(solid(slab(COOL, 25, 6, 6, 0.8), { tone: 'hi', lit }))
      // heat pipes along the base
      for (const y of [40, 85, 130]) out.push(line(top([COOL.x + 6, y], [COOL.x + COOL.w - 6, y], 31), 'mid'))
      // fins: thin plates across the base, painted far to near
      const fins: number[] = []
      for (let x = COOL.x + 6; x <= COOL.x + COOL.w - 8; x += 9) fins.push(x)
      for (const x of byDepth(fins, (x) => [x, COOL.y + COOL.d / 2, 40])) out.push(solid(slab({ x, y: COOL.y + 4, w: 2, d: COOL.d - 8, r: 0 }, 31, 30, 1), { tone: 'hi', lit, crease: 'none' }))
      return out.join('')
    },
  }))
