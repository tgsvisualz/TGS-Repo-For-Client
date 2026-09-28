import type { CSSProperties, ReactNode } from 'react'
import { Art, type ArtProps } from '../art'
import { getAsset } from '../data/catalog'
import type { AssetEntry } from '../data/types'
import { cx } from '../lib/cx'
import styles from './Placeholder.module.css'

export interface PlaceholderProps {
  /** Registry ID from src/data/catalog.ts (e.g. "PIECE-OMBRA"). */
  assetId: string
  /** Width ÷ height of the slot, e.g. 4 / 5. Sets the box's aspect-ratio and the art's frame. */
  ratio: number
  className?: string
  /** For a real photo (`src` set in the catalog). Default 'lazy'. */
  loading?: 'lazy' | 'eager'
  /** Hide the image from assistive tech (its content is described elsewhere). Default false. */
  decorative?: boolean
  /** Passed to <Art>: draw the lit backdrop behind the subject. Default true. */
  backdrop?: boolean
  /** Overlays drawn above the image (captions, veils). Position them yourself; they stay accessible. */
  children?: ReactNode
}

function findAsset(id: string): AssetEntry | null {
  try {
    return getAsset(id)
  } catch (error) {
    if (import.meta.env.DEV) console.error(error)
    return null
  }
}

/**
 * THE image slot. Renders the client's photo when the catalog entry has `src`, otherwise the
 * placeholder art for that entry. Carries `data-asset-id` for the asset-ID overlay (Shift+A).
 * The root is position: relative and overflow: hidden, and its ::after is reserved for that
 * overlay label, so draw veils as children.
 */
export function Placeholder({
  assetId,
  ratio,
  className,
  loading = 'lazy',
  decorative = false,
  backdrop = true,
  children,
}: PlaceholderProps) {
  const entry = findAsset(assetId)
  const style = { '--ratio': String(ratio) } as CSSProperties

  let media: ReactNode = null
  if (entry?.src) {
    media = (
      <img
        className={styles.media}
        src={entry.src}
        alt={decorative ? '' : entry.alt}
        loading={loading}
        decoding="async"
      />
    )
  } else if (entry) {
    // Spread so this compiles against both the Phase-0 Art stub and the final Art API.
    const artProps: ArtProps & { backdrop?: boolean } = { spec: entry.art, ratio, backdrop, className: styles.art }
    media = (
      <div
        className={styles.media}
        {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': entry.alt })}
      >
        <Art {...artProps} />
      </div>
    )
  }

  return (
    <div data-asset-id={assetId} className={cx(styles.root, className)} style={style}>
      {media}
      {children}
    </div>
  )
}
