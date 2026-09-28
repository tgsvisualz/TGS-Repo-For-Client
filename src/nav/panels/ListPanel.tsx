import type { NavLink } from '../../data/types'
import styles from './panels.module.css'

export interface ListPanelProps {
  links: NavLink[]
}

/** The House: a plain list, like the reference's "Destinations". */
export function ListPanel({ links }: ListPanelProps) {
  return (
    <ul role="list" className={styles.list}>
      {links.map((link) => (
        <li key={link.label}>
          <a href={link.href} className={styles.listRow}>
            <span className={styles.rowLabel}>{link.label}</span>
            {link.description ? <span className={styles.listDesc}>{link.description}</span> : null}
          </a>
        </li>
      ))}
    </ul>
  )
}
