/**
 * The dark showroom: backdrop wall with one warm key-light pool, a faint shaft of light, the
 * floor line, a pool of light on the floor, a soft reflection, the plinth for still lifes and
 * a gentle vignette. Everything is gradients: no filters, so ~50 of these stay cheap.
 */
import type { ReactElement, ReactNode } from 'react'
import { fmt, type Box } from './geom'
import { STAGE } from './palette'
import { acrossLight, type LightDir, type Paint } from './paint'

export interface StageSpec {
  vb: Box
  light: LightDir
  /** Subject centre x. */
  cx: number
  /** Wall/floor junction. */
  floorY: number
  /** Where the subject stands (centre of the floor pool). */
  footY: number
  /** Centre height of the pool of light on the wall. */
  wallY: number
  /** Size of the subject (1 = one standing figure). */
  scale: number
}

const dirOf = (L: LightDir): number => (L === 'left' ? -1 : L === 'right' ? 1 : 0)

function rectFill(b: Box, fill: string, key: string, extra: Record<string, string> = {}): ReactElement {
  return <rect key={key} x={fmt(b.x)} y={fmt(b.y)} width={fmt(b.w)} height={fmt(b.h)} fill={fill} {...extra} />
}

export function backdrop(p: Paint, s: StageSpec): ReactElement {
  const { vb } = s
  const k = s.scale
  const d = dirOf(s.light)
  const wallBottom = Math.min(s.floorY, vb.y + vb.h)
  const wallTop = Math.min(vb.y, wallBottom - 200)
  const kids: ReactNode[] = []
  kids.push(rectFill(vb, p.linear([[0, STAGE.ink0], [0.55, STAGE.ink1], [1, STAGE.ink2]], 0, wallTop, 0, wallBottom), 'w'))

  if (s.light === 'back') {
    // Backlight: the wall behind the group glows; the figures read as silhouettes.
    kids.push(rectFill(vb, p.radial([[0, '#5C5044', 1], [0.25, STAGE.poolHot, 0.95], [0.55, STAGE.pool, 0.55], [1, STAGE.ink2, 0]], s.cx, s.wallY, 440 * k, 540 * k), 'g'))
    kids.push(rectFill(vb, p.radial([[0, STAGE.key, 0.2], [0.5, STAGE.key, 0.06], [1, STAGE.key, 0]], s.cx, s.wallY - 20 * k, 190 * k, 280 * k), 'h'))
  } else {
    const px = s.cx + d * 170 * k
    kids.push(rectFill(vb, p.radial([[0, STAGE.pool, 1], [0.34, STAGE.pool, 0.62], [0.7, STAGE.ink2, 0.3], [1, STAGE.ink2, 0]], px, s.wallY, 400 * k, 500 * k), 'g'))
    // A faint shaft from the key down to the subject: an elongated glow, soft on every side.
    const sx = s.cx + d * 420 * k
    const sy = vb.y - 160 * k
    const tx = s.cx + d * 30 * k
    const ty = s.footY
    const len = Math.hypot(tx - sx, ty - sy)
    const ang = (Math.atan2(ty - sy, tx - sx) * 180) / Math.PI
    kids.push(
      rectFill(
        vb,
        p.radial([[0, STAGE.key, 0.07], [0.45, STAGE.key, 0.035], [1, STAGE.key, 0]], (sx + tx) / 2, (sy + ty) / 2, len / 2, 150 * k, ang),
        'b',
      ),
    )
  }
  return <g data-part="backdrop">{kids}</g>
}

export function floor(p: Paint, s: StageSpec): ReactElement | null {
  const { vb } = s
  const bottom = vb.y + vb.h
  if (s.floorY >= bottom) return null
  const k = s.scale
  const d = dirOf(s.light)
  const fb: Box = { x: vb.x, y: s.floorY, w: vb.w, h: bottom - s.floorY }
  const kids: ReactNode[] = []
  kids.push(rectFill(fb, p.linear([[0, STAGE.ink2], [0.3, '#161411'], [1, STAGE.ink0]], 0, s.floorY, 0, Math.max(bottom, s.floorY + 120)), 'f'))
  // The junction: a soft band of light where wall meets floor, brightest near the key.
  const band: Box = { x: vb.x, y: s.floorY - 6, w: vb.w, h: 12 }
  kids.push(
    rectFill(
      band,
      p.radial([[0, STAGE.poolHot, 0.55], [0.5, STAGE.pool, 0.2], [1, STAGE.pool, 0]], s.cx + d * 120 * k, s.floorY, 520 * k, 6),
      'j',
    ),
  )
  const poolX = s.light === 'back' ? s.cx : s.cx + d * 40 * k
  const poolY = s.light === 'back' ? s.footY - 26 * k : s.footY
  kids.push(
    rectFill(
      fb,
      p.radial([[0, STAGE.poolHot, 0.95], [0.3, STAGE.pool, 0.7], [0.7, STAGE.pool, 0.18], [1, STAGE.pool, 0]], poolX, poolY, 330 * k, 64 * k),
      'p',
    ),
  )
  return <g data-part="floor">{kids}</g>
}

/** Soft contact shadow under feet or an object. */
export function contact(p: Paint, cx: number, y: number, rx: number, ry: number, a = 0.85): ReactElement {
  return (
    <ellipse
      key="contact"
      cx={fmt(cx)}
      cy={fmt(y)}
      rx={fmt(rx)}
      ry={fmt(ry)}
      fill={p.radial([[0, STAGE.shadow, a], [0.6, STAGE.shadow, a * 0.45], [1, STAGE.shadow, 0]], cx, y, rx, ry)}
    />
  )
}

/** A faint mirrored copy of the subject on the floor, fading with distance. */
export function reflection(p: Paint, href: string, footY: number, vb: Box, a = 0.12): ReactElement | null {
  const bottom = vb.y + vb.h
  if (footY >= bottom - 4) return null
  const mb: Box = { x: vb.x, y: footY, w: vb.w, h: bottom - footY }
  const fade = p.linear([[0, '#FFFFFF', 1], [1, '#FFFFFF', 0]], 0, footY, 0, footY + 150)
  return (
    <g key="refl" mask={p.mask(mb, fade)} opacity={fmt(a)}>
      <use href={href} transform={`matrix(1 0 0 -1 0 ${fmt(footY * 2)})`} />
    </g>
  )
}

export function vignette(p: Paint, vb: Box, cx: number, cy: number, a = 0.55): ReactElement {
  const r = Math.max(vb.w, vb.h) * 0.78
  return rectFill(vb, p.radial([[0, STAGE.ink0, 0], [0.5, STAGE.ink0, 0], [1, STAGE.ink0, a]], cx, cy, r, r * 0.92), 'vig', { pointerEvents: 'none' })
}

/** Low dark plinth: lighter top face, spotlight pool, crisp front-edge highlight. */
export function plinth(p: Paint, cx: number, topY: number, w: number, L: LightDir): { node: ReactElement; box: Box } {
  const depth = 40
  const h = 90
  const inset = w * 0.035
  const x0 = cx - w / 2
  const x1 = cx + w / 2
  const d = dirOf(L)
  const topFace = `M${fmt(x0 + inset)} ${fmt(topY - depth)}L${fmt(x1 - inset)} ${fmt(topY - depth)}L${fmt(x1)} ${fmt(topY)}L${fmt(x0)} ${fmt(topY)}Z`
  const topBox: Box = { x: x0, y: topY - depth, w, h: depth }
  const frontBox: Box = { x: x0, y: topY, w, h }
  const node = (
    <g data-part="plinth">
      <path d={topFace} fill={acrossLight(p, [[0, '#312B26'], [0.5, '#25201D'], [1, '#191614']], topBox, L === 'top' || L === 'back' ? 'left' : L)} />
      <path d={topFace} fill={p.radial([[0, STAGE.poolHot, 0.9], [0.45, STAGE.pool, 0.45], [1, STAGE.pool, 0]], cx + d * 50, topY - depth * 0.45, w * 0.42, depth * 1.6)} />
      {rectFill(frontBox, p.linear([[0, '#1C1916'], [0.4, '#131110'], [1, '#0C0B0A']], 0, topY, 0, topY + h), 'ff')}
      {rectFill(frontBox, acrossLight(p, [[0, STAGE.pool, 0.35], [0.5, STAGE.pool, 0.08], [1, STAGE.ink0, 0.35]], frontBox, L === 'top' || L === 'back' ? 'left' : L), 'fl')}
      {rectFill(
        { x: x0, y: topY - 1, w, h: 3 },
        p.radial([[0, '#8C7D6C', 0.95], [0.5, '#5A4F45', 0.5], [1, '#3A332D', 0.1]], cx + d * 90, topY, w * 0.55, 3),
        'edge',
      )}
    </g>
  )
  return { node, box: { x: x0, y: topY - depth, w, h: depth + h } }
}
