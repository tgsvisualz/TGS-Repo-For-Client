import styles from './Grain.module.css'

/**
 * The single static film-grain layer (DESIGN §4): fixed over the whole viewport at ~5%,
 * above everything but the cursor, and inert to the pointer. Render it once, in App.
 */
export function Grain() {
  return <div className={styles.grain} aria-hidden="true" />
}
