/**
 * Assembles a veiled figure: back veil, legs and shoes, body, garment, head and hair, arms,
 * carried bag, hands, front veil. Built on the canonical pose and mirrored as a whole for
 * variety; light is flipped with it so the key always lands where the spec asks.
 */
import type { ReactElement, ReactNode } from 'react'
import type { BagShape, FigureArtSpec } from '../data/types'
import { bag, CARRY_SCALE, type BagDraw } from './bags'
import { ANKLE, armShape, handPoints, LEG, limb, shoe, TORSO, torsoBox, wristOf, type ArmPose, type Side } from './body'
import { dress, type View } from './garments'
import { boxOf, fmt, fold, ribbon, spline, union, boxOfC, type Box, type CPt, type Knot, type Pt } from './geom'
import { hairFront, hairRear, head, veil, veilExtent } from './head'
import { SHOE, SKIN, FABRIC } from './palette'
import { piece, type Fold, type LightDir, type Paint, type Piece } from './paint'

export interface FigureOut {
  node: ReactElement
  /** Everything drawn, in scene coordinates. */
  extent: Box
  /** The carrying hand (or the key-side hand): the focus of a 'detail' crop. */
  anchor: Pt
  /** Top of the silhouette (veil apex). */
  top: number
}

export interface FigureOpts {
  view: View
  /** Deterministic variation (veil drift). */
  seed: number
  /** Element id so a reflection can <use> it. */
  id?: string
  /** Placement for group shots, applied outside the figure group. */
  place?: { x: number; y: number; s: number }
}

type CarryMode = 'hang' | 'clutch' | 'shoulder' | 'crossbody'

const CARRY_MODE: Record<BagShape, CarryMode> = {
  'top-handle': 'hang',
  tote: 'hang',
  mini: 'hang',
  evening: 'hang',
  pouch: 'hang',
  clutch: 'clutch',
  shoulder: 'shoulder',
  crossbody: 'crossbody',
}

const flip = (L: LightDir): LightDir => (L === 'left' ? 'right' : L === 'right' ? 'left' : L)
const mirrorBox = (b: Box): Box => ({ x: 1000 - b.x - b.w, y: b.y, w: b.w, h: b.h })

export function mirrorFor(spec: FigureArtSpec): boolean {
  return spec.model === 'C'
}

export function drawFigure(p: Paint, spec: FigureArtSpec, light: LightDir, o: FigureOpts): FigureOut {
  const mirror = mirrorFor(spec)
  const L = mirror ? flip(light) : light
  const view = o.view
  const skin = SKIN[spec.model]
  const sway = ((o.seed % 17) - 8) * (view === 'back' ? 1.6 : 1.1)
  const carrySide: Side = L === 'right' ? 'R' : 'L'
  const far: Side = carrySide === 'L' ? 'R' : 'L'
  // The key-side arm hangs straight (it carries); the far arm bends, its hand at the thigh.
  const pose: ArmPose = { bent: view === 'front' ? far : null }
  const outfit = dress(spec.outfit, view, pose)
  const kids: ReactNode[] = []
  const boxes: Box[] = []
  const add = (node: ReactNode, box?: Box): void => {
    kids.push(node)
    if (box) boxes.push(box)
  }

  const skinPiece = (d: string, box: Box, key: string, extra: Partial<Piece> = {}): ReactElement =>
    piece(p, { d, box, tone: skin, mat: 'skin', ...extra }, L, key)

  const legsVisible = outfit.hem < 955
  const drawShoes = (): void => {
    for (const s of ['L', 'R'] as const) {
      if (view === 'front') {
        const sh = shoe(s)
        add(piece(p, { d: sh.d, box: sh.box, tone: SHOE, mat: 'leather', folds: [{ d: sh.shine, u: 0.3, hi: true }] }, L, `shoe${s}`), sh.box)
      } else {
        const [ax, ay] = ANKLE[s]
        const heel: Knot[] = [[ax - 11, ay + 10, 1], [ax + 11, ay + 10, 1], [ax + 10, ay + 26], [ax + 3, ay + 30], [ax + 2, 996, 1], [ax - 2, 996, 1], [ax - 3, ay + 30], [ax - 10, ay + 26]]
        add(piece(p, { d: spline(heel, true), box: boxOf(heel), tone: SHOE, mat: 'leather' }, L, `heel${s}`), boxOf(heel))
      }
    }
  }
  // Only the leg below the hem is drawn: nothing shows through the gap between trouser legs.
  const drawLegs = (): void => {
    const from = outfit.hem - 16
    for (const s of ['R', 'L'] as const) {
      const c = LEG[s]
      const i = c.findIndex((q) => q[1] > from)
      if (i < 0) continue
      const a = c[Math.max(0, i - 1)]
      const b = c[i]
      const t = i === 0 ? 0 : (from - a[1]) / (b[1] - a[1])
      const start: CPt = [a[0] + (b[0] - a[0]) * t, Math.max(a[1], from), a[2] + (b[2] - a[2]) * t]
      const lg = limb([start, ...c.slice(i)], 0, 4)
      add(skinPiece(lg.d, lg.box, `leg${s}`, { ao: 0.3, rim: 0.6 }), lg.box)
    }
  }
  const torso = (): void => {
    const tb = torsoBox()
    const collar =
      view === 'front'
        ? [
            { d: fold([[482, 222], [460, 228], [438, 238]], 5), u: 0.2, hi: true, a: 0.7 },
            { d: fold([[522, 216], [545, 222], [566, 232]], 5), u: 0.8, hi: true, a: 0.7 },
            { d: fold([[500, 236], [501, 262], [502, 290]], 7), u: 0.5, hi: false, a: 0.35 },
          ]
        : [{ d: fold([[501, 214], [502, 300], [503, 400]], 7), u: 0.5, hi: false, a: 0.5 }]
    add(piece(p, { d: spline(TORSO, true), box: tb, tone: skin, mat: 'skin', folds: collar, aoTop: 0.2 }, L, 'torso'), tb)
  }
  const garment = (): void => {
    outfit.upper.forEach((pc, i) => add(piece(p, pc, L, `u${i}`), pc.box))
    outfit.lower.forEach((pc, i) => add(piece(p, pc, L, `l${i}`), pc.box))
    outfit.over.forEach((pc, i) => add(piece(p, pc, L, `o${i}`), pc.box))
  }
  // The arm away from the key is half-hidden by the body: keep it in shadow.
  const sideLit = L === 'left' || L === 'right'
  const dimFor = (s: Side, k: number): number => (sideLit && s === far ? k : 0)
  // Edge light only on outer edges: the key arm's rim side and the far arm's key side face the body.
  const edges = (s: Side): { rim: number; key: number } => (sideLit ? (s === far ? { rim: 1, key: 0.25 } : { rim: 0.2, key: 1 }) : { rim: 0.6, key: 0.8 })
  // Arm and hand are one skin shape; sleeves go over it. Seen from behind, no hands show.
  const arm = (s: Side, grip = false): Pt => {
    const withHand = view === 'front' ? (grip ? 'grip' : 'relaxed') : undefined
    const hp = view === 'front' ? handPoints(s, pose, grip) : null
    if (outfit.bareArms || withHand) {
      const a = armShape(s, view, pose, undefined, withHand)
      const folds: Fold[] = hp ? [{ d: hp.crease, u: 0.5, hi: false, a: 0.3 }] : []
      add(skinPiece(a.d, a.box, `arm${s}`, { ...edges(s), dim: dimFor(s, 0.38), folds }), a.box)
    }
    outfit.sleeves[s]?.forEach((pc, i) => add(piece(p, { ...pc, ...edges(s), dim: dimFor(s, 0.3) || pc.dim }, L, `sl${s}${i}`), pc.box))
    return hp ? hp.palm : wristOf(s, pose).at
  }
  /** Place a bag by its local origin (bottom centre). */
  const placeBag = (b: BagDraw, origin: Pt, s: number): Box => {
    const [tx, ty] = origin
    const bb: Box = { x: tx + b.box.x * s, y: ty + b.box.y * s, w: b.box.w * s, h: b.box.h * s }
    add(
      <g key="bag" transform={`translate(${fmt(tx)} ${fmt(ty)}) scale(${fmt(s)})`}>
        {b.node}
      </g>,
      bb,
    )
    return bb
  }

  let anchor: Pt = wristOf(carrySide, pose).at

  if (view === 'front') {
    add(veil(p, { model: spec.model, tone: spec.veil, light: L, layer: 'back', sway }), veilExtent(spec.model, 'back', sway))
    if (legsVisible) drawLegs()
    drawShoes()
    torso()
    garment()
    add(head(p, spec.model, L))
    add(hairFront(p, spec.model, L))

    const carry = spec.carry
    const mode = carry ? CARRY_MODE[carry.shape] : null
    if (carry && mode) {
      const s = CARRY_SCALE[carry.shape]
      const b = bag(p, carry.shape, carry.fabric, L, 'carry')
      if (mode === 'shoulder' || mode === 'crossbody') {
        // Worn on the body: strap and bag first, then the arm hangs over them.
        const sx = carrySide === 'L' ? 1 : -1
        const bottom: Pt = mode === 'shoulder' ? [500 - 74 * sx, 548] : [500 - 70 * sx, 522]
        const at = (q: Pt): Pt => [bottom[0] + q[0] * s, bottom[1] + q[1] * s]
        const [a0, a1] = b.attach
        const nearA = sx > 0 ? at(a1) : at(a0)
        const farA = sx > 0 ? at(a0) : at(a1)
        const strapT = FABRIC[carry.fabric]
        const strap = (c: CPt[], key: string, rim: number): void =>
          add(piece(p, { d: ribbon(c, 2, 3), box: boxOfC(c, 2), tone: strapT, mat: 'leather', rim }, L, key))
        if (mode === 'shoulder') {
          const shoulder: Pt = [500 - 72 * sx, 236]
          strap([[farA[0], farA[1], 7], [farA[0] + 16 * sx, farA[1] - 110, 7], [shoulder[0] - 8 * sx, shoulder[1] + 60, 7], [shoulder[0], shoulder[1], 7]], 'strapR', 0.6)
          placeBag(b, bottom, s)
          strap([[nearA[0], nearA[1], 7], [nearA[0] - 14 * sx, nearA[1] - 110, 7], [shoulder[0] + 16 * sx, shoulder[1] + 60, 7], [shoulder[0] + 6 * sx, shoulder[1] - 2, 7]], 'strapF', 0.8)
          anchor = [bottom[0], bottom[1] - 70]
        } else {
          const shoulder: Pt = [500 + 66 * sx, 230]
          placeBag(b, bottom, s)
          strap([[nearA[0], nearA[1], 6], [nearA[0] + 40 * sx, nearA[1] - 90, 6], [shoulder[0] - 44 * sx, shoulder[1] + 90, 6], [shoulder[0], shoulder[1], 6]], 'strap', 0.8)
          anchor = [bottom[0], bottom[1] - 40]
        }
        arm(far)
        arm(carrySide)
      } else {
        // In the hand: the bag first, so the closed fingers cover the handle.
        const palm = handPoints(carrySide, pose, true).palm
        const hold: Pt = mode === 'clutch' ? [palm[0], palm[1] + 6] : palm
        const bb = placeBag(b, [hold[0] - b.grip[0] * s, hold[1] - b.grip[1] * s], s)
        arm(far)
        arm(carrySide, true)
        anchor = [bb.x + bb.w / 2, Math.min(bb.y + bb.h * 0.55, palm[1] + 60)]
      }
    } else {
      arm(far)
      anchor = arm(carrySide)
    }
    add(veil(p, { model: spec.model, tone: spec.veil, light: L, layer: 'front', sway: sway * 0.6 }))
  } else {
    // Seen from behind: arms swing forward out of sight, the veil trails down the back.
    arm('L')
    arm('R')
    if (legsVisible) drawLegs()
    if (outfit.hem < 975) drawShoes()
    torso()
    garment()
    add(hairRear(p, spec.model, L))
    add(veil(p, { model: spec.model, tone: spec.veil, light: L, layer: 'rear', sway }), veilExtent(spec.model, 'rear', sway))
    anchor = [500, 470]
  }

  let extent = union(...boxes)
  let top = veilExtent(spec.model, 'front', sway).y
  if (mirror) {
    extent = mirrorBox(extent)
    anchor = [1000 - anchor[0], anchor[1]]
  }
  top = Math.min(top, extent.y)
  let inner: ReactNode = kids
  if (mirror) inner = <g transform="matrix(-1 0 0 1 1000 0)">{kids}</g>
  let node = (
    <g data-part="figure" id={o.id}>
      {inner}
    </g>
  )
  if (o.place) {
    const { x, y, s } = o.place
    node = (
      <g key={o.id} transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
        {node}
      </g>
    )
    extent = { x: x + extent.x * s, y: y + extent.y * s, w: extent.w * s, h: extent.h * s }
    anchor = [x + anchor[0] * s, y + anchor[1] * s]
    top = y + top * s
  }
  return { node, extent, anchor, top }
}
