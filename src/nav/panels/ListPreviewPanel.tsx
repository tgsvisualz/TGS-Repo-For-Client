import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Icon, Placeholder } from '../../components'
import { getCategory } from '../../data/catalog'
import type { CategoryId, NavLink } from '../../data/types'
import { cx } from '../../lib'
import styles from './panels.module.css'

export interface ListPreviewPanelProps {
  categoryId: CategoryId
  viewAll: NavLink
  /** Whether this panel is the one on show (resets to the first row a moment after it hides). */
  active: boolean
}

interface PreviewState {
  current: number
  /** The preview that was current just before: it holds beneath the incoming one while it fades in. */
  previous: number
}

const FIRST: PreviewState = { current: 0, previous: -1 }
/** Wait out the panel's leave animation before quietly resetting to the first row. */
const RESET_AFTER = 320

/**
 * Bags, Purses, Tops, Pants, Dresses: four described rows plus "All …" on the left, a large
 * preview on the right that swaps to the hovered or focused row. All four previews stay stacked
 * and cross-fade by class, so fast hovering interrupts cleanly.
 */
export function ListPreviewPanel({ categoryId, viewAll, active }: ListPreviewPanelProps) {
  const category = getCategory(categoryId)
  const rows = category.subcategories
  const [preview, setPreview] = useState<PreviewState>(FIRST)
  /** The row under the pointer or focus (rows.length = the "All …" row); null → the current preview's row. */
  const [pointed, setPointed] = useState<number | null>(null)

  useEffect(() => {
    if (active) return
    const timer = window.setTimeout(() => {
      setPreview(FIRST)
      setPointed(null)
    }, RESET_AFTER)
    return () => window.clearTimeout(timer)
  }, [active])

  const point = (index: number) => {
    setPointed(index)
    if (index < rows.length) {
      setPreview((state) => (state.current === index ? state : { current: index, previous: state.current }))
    }
  }
  const onPointerEnter = (index: number) => (event: ReactPointerEvent) => {
    if (event.pointerType !== 'touch') point(index)
  }
  const highlight = pointed ?? preview.current
  const shown = rows[preview.current]

  return (
    <div className={styles.listPreview}>
      <ul role="list" className={styles.rows} onPointerLeave={() => setPointed(null)}>
        {rows.map((row, index) => (
          <li key={row.id}>
            <a
              href={row.href}
              className={styles.row}
              data-highlight={highlight === index || undefined}
              onPointerEnter={onPointerEnter(index)}
              onFocus={() => point(index)}
              onBlur={() => setPointed(null)}
            >
              <span className={styles.rowLabel}>{row.label}</span>
              <span className={styles.rowDesc}>{row.description}</span>
            </a>
          </li>
        ))}
        <li className={styles.viewAllItem}>
          <a
            href={viewAll.href}
            className={cx(styles.row, styles.viewAll)}
            data-highlight={highlight === rows.length || undefined}
            onPointerEnter={onPointerEnter(rows.length)}
            onFocus={() => point(rows.length)}
            onBlur={() => setPointed(null)}
          >
            <span className={styles.rowLabel}>
              {viewAll.label}
              {viewAll.description ? <span className={styles.viewAllMeta}> · {viewAll.description}</span> : null}
            </span>
            <Icon name="arrow-right" size={14} className={styles.viewAllIcon} />
          </a>
        </li>
      </ul>

      <div className={styles.previewCol}>
        {/* Mouse shortcut to the shown row; the rows carry the accessible links. */}
        <a href={shown.href} className={styles.preview} tabIndex={-1} aria-hidden="true" data-cursor="view">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className={styles.slide}
              data-current={index === preview.current ? 'true' : undefined}
              data-previous={index === preview.previous ? 'true' : undefined}
            >
              <Placeholder assetId={row.assetId} ratio={5 / 4} decorative className={styles.slideArt} />
            </div>
          ))}
        </a>
        <p className={styles.previewCaption} aria-hidden="true">
          <span>{category.label}</span>
          <span className={styles.previewCaptionRow}>{shown.label}</span>
        </p>
      </div>
    </div>
  )
}
