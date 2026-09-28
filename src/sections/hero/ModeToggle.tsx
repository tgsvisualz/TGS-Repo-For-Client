import type { CSSProperties } from 'react'
import { cx } from '../../lib'
import styles from './ModeToggle.module.css'
import type { Hero3DState } from './useHero3D'

const FALLBACK_NOTE = 'The 3D showroom could not start on this device, so the still showroom is showing instead.'

export interface ModeToggleProps {
  state: Hero3DState
  /** The 3D layer is mounted (loading or ready). */
  showing3d: boolean
  onChoose: (mode: '3d' | 'still') => void
  className?: string
  style?: CSSProperties
}

/**
 * Glass segmented control: "3D" / "Still". Plain buttons with aria-pressed, so Tab, Enter and
 * Space work natively. While the showroom loads, the 3D segment breathes; if it fails, the
 * segment reads "3D unavailable" (aria-disabled, still focusable so its note can be read).
 */
export function ModeToggle({ state, showing3d, onChoose, className, style }: ModeToggleProps) {
  const failed = state === 'failed'
  const on3d = showing3d && !failed

  return (
    <div role="group" aria-label="Showroom view" className={cx(styles.toggle, className)} style={style} data-state={state}>
      <button
        type="button"
        className={cx(styles.option, styles.option3d)}
        aria-pressed={on3d}
        aria-disabled={failed || undefined}
        title={failed ? FALLBACK_NOTE : undefined}
        onClick={failed ? undefined : () => onChoose('3d')}
      >
        {failed ? '3D unavailable' : '3D'}
      </button>
      <button type="button" className={styles.option} aria-pressed={!on3d} onClick={() => onChoose('still')}>
        Still
      </button>
    </div>
  )
}
