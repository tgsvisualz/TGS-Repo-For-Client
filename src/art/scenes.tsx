/**
 * Scene builders: a veiled figure in the showroom, a bag on its plinth, and the trio. Each
 * returns the viewBox (composed for the frame's ratio), the <defs> and the drawing.
 */
import type { ReactElement, ReactNode } from 'react'
import type { ArtSpec, FigureArtSpec, ProductArtSpec, TrioArtSpec } from '../data/types'
import { bag, STILL_SCALE } from './bags'
import { figureFocus, fit, leanFor } from './compose'
import { drawFigure } from './figure'
import { clamp, fmt, hash, union, type Box } from './geom'
import { Paint } from './paint'
import { backdrop, contact, floor, plinth, reflection, vignette, type StageSpec } from './stage'

export interface Scene {
  viewBox: string
  defs: ReactElement[]
  body: ReactNode
}

const vbString = (b: Box): string => `${fmt(b.x)} ${fmt(b.y)} ${fmt(b.w)} ${fmt(b.h)}`

/** Floor contact of a standing figure, and the wall/floor junction behind it. */
const FOOT_Y = 996
const FLOOR_Y = 846

function figureScene(p: Paint, spec: FigureArtSpec, ratio: number, withStage: boolean): Scene {
  const light = spec.light ?? 'left'
  const view = spec.crop === 'back' ? 'back' : 'front'
  const figId = p.id('fig')
  const fig = drawFigure(p, spec, light, { view, seed: hash(JSON.stringify(spec)), id: figId })
  const { focus, ay } = figureFocus(spec.crop, fig, !withStage)
  const vb = fit(focus, ratio, withStage ? leanFor(light) : 0.5, ay)
  const kids: ReactNode[] = []
  if (withStage) {
    const st: StageSpec = { vb, light, cx: 500, floorY: FLOOR_Y, footY: FOOT_Y, wallY: light === 'top' ? 250 : 330, scale: 1 }
    kids.push(<g key="bd">{backdrop(p, st)}</g>)
    const fl = floor(p, st)
    if (fl) kids.push(<g key="fl">{fl}</g>)
    const refl = reflection(p, `#${figId}`, FOOT_Y - 2, vb)
    if (refl) kids.push(refl)
    kids.push(contact(p, 508, FOOT_Y - 1, 96, 11))
  } else if (spec.crop === 'full' || spec.crop === 'back' || spec.crop === 'lower') {
    kids.push(contact(p, 508, FOOT_Y - 1, 84, 8, 0.45))
  }
  kids.push(<g key="fig">{fig.node}</g>)
  if (withStage) kids.push(vignette(p, vb, 500, fig.anchor[1] * 0.2 + 400))
  return { viewBox: vbString(vb), defs: p.defs, body: kids }
}

function productScene(p: Paint, spec: ProductArtSpec, ratio: number, withStage: boolean): Scene {
  const L = spec.light ?? 'left'
  const s = STILL_SCALE[spec.shape]
  const b = bag(p, spec.shape, spec.fabric, L, 'still')
  const baseY = 702
  const topY = 718
  // Frame and plinth follow the bag itself; straps and chains may trail off the edges.
  const bagBox: Box = { x: 500 + b.core.x * s, y: baseY + b.core.y * s, w: b.core.w * s, h: b.core.h * s }
  const w = clamp(Math.max(bagBox.w, 260) + 100, 400, 600)
  const focus: Box = { x: 500 - w / 2 - 18, y: bagBox.y - 40, w: w + 36, h: topY + 78 - (bagBox.y - 40) }
  const vb = fit(focus, ratio, leanFor(L), 0.55)
  const kids: ReactNode[] = []
  const obj = (
    <g key="obj" data-part="object" transform={`translate(500 ${baseY}) scale(${fmt(s)})`}>
      {b.node}
    </g>
  )
  if (withStage) {
    const st: StageSpec = { vb, light: L, cx: 500, floorY: 760, footY: topY + 90, wallY: 430, scale: 1.05 }
    kids.push(<g key="bd">{backdrop(p, st)}</g>)
    const fl = floor(p, st)
    if (fl) kids.push(<g key="fl">{fl}</g>)
    kids.push(<g key="pl">{plinth(p, 500, topY, w, L).node}</g>)
    kids.push(contact(p, 500, baseY + 2, Math.min(bagBox.w, 360) * 0.55, 13, 0.9))
    kids.push(obj)
    kids.push(vignette(p, vb, 500, 560, 0.5))
  } else {
    kids.push(contact(p, 500, baseY + 2, Math.min(bagBox.w, 360) * 0.5, 10, 0.5))
    kids.push(obj)
  }
  return { viewBox: vbString(vb), defs: p.defs, body: kids }
}

/** The three hero looks, backlit: B left, A centre and forward, C right. */
const TRIO: readonly FigureArtSpec[] = [
  { kind: 'figure', model: 'B', veil: 'tulle', outfit: { kind: 'separates', top: 'draped', topFabric: 'noir', trouser: 'wide-leg', trouserFabric: 'noir' }, crop: 'full' },
  { kind: 'figure', model: 'C', veil: 'smoke', outfit: { kind: 'dress', cut: 'slip', fabric: 'garnet' }, crop: 'full' },
  { kind: 'figure', model: 'A', veil: 'ivory', outfit: { kind: 'dress', cut: 'column', fabric: 'noir' }, crop: 'full' },
]

function trioScene(p: Paint, _spec: TrioArtSpec, ratio: number, withStage: boolean): Scene {
  const places = [
    { x: -118, y: 78, s: 0.9 },
    { x: 218, y: 78, s: 0.9 },
    { x: -6, y: 6, s: 1.01 },
  ]
  const figs = TRIO.map((spec, i) => drawFigure(p, spec, 'back', { view: 'front', seed: 11 + i * 5, id: p.id('tf'), place: places[i] }))
  const ext = union(...figs.map((f) => f.extent))
  const top = Math.min(...figs.map((f) => f.top))
  const focus: Box = { x: ext.x - 24, y: top - 26, w: ext.w + 48, h: 1034 - (top - 26) }
  const vb = fit(focus, ratio, 0.5, 0.42)
  const kids: ReactNode[] = []
  if (withStage) {
    const st: StageSpec = { vb, light: 'back', cx: 500, floorY: 872, footY: 992, wallY: 470, scale: 1.3 }
    kids.push(<g key="bd">{backdrop(p, st)}</g>)
    const fl = floor(p, st)
    if (fl) kids.push(<g key="fl">{fl}</g>)
  }
  places.forEach((pl, i) => kids.push(<g key={`c${i}`}>{contact(p, pl.x + 506 * pl.s, pl.y + 995 * pl.s, 90 * pl.s, 10, 0.8)}</g>))
  figs.forEach((f, i) => kids.push(<g key={`f${i}`}>{f.node}</g>))
  if (withStage) kids.push(vignette(p, vb, 500, 470, 0.6))
  return { viewBox: vbString(vb), defs: p.defs, body: kids }
}

export function buildScene(spec: ArtSpec, ratio: number, withStage: boolean, uid: string): Scene {
  const p = new Paint(uid)
  const r = Number.isFinite(ratio) && ratio > 0 ? clamp(ratio, 0.2, 5) : 0.8
  switch (spec.kind) {
    case 'figure':
      return figureScene(p, spec, r, withStage)
    case 'product':
      return productScene(p, spec, r, withStage)
    case 'trio':
      return trioScene(p, spec, r, withStage)
  }
}
