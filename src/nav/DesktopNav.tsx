import { useId } from 'react'
import { Icon } from '../components'
import { NAV_ITEMS } from '../data/catalog'
import type { NavItemId } from '../data/types'
import styles from './DesktopNav.module.css'
import { NavViewport } from './NavViewport'
import { useNavController } from './useNavController'

const NAV_IDS: readonly NavItemId[] = NAV_ITEMS.map((item) => item.id)

/**
 * Desktop primary nav (≥ BREAKPOINTS.nav): disclosure triggers centred in the header and the
 * shared mega-dropdown viewport. Hover-driven on fine pointers; click toggles; full keyboard
 * support (Enter/Space/↓ open instantly into the panel, ←/→ between triggers, Esc closes).
 */
export function DesktopNav() {
  const nav = useNavController(NAV_IDS)
  const { snapshot } = nav
  const baseId = useId()
  const panelId = (id: NavItemId) => `${baseId}-panel-${id}`

  return (
    <nav
      ref={nav.navRef}
      aria-label="Primary"
      className={styles.nav}
      data-instant={snapshot.motion === 'instant' ? '' : undefined}
      onPointerEnter={nav.onZoneEnter}
      onPointerLeave={nav.onZoneLeave}
      onFocus={nav.mount}
      onBlur={nav.onNavBlur}
    >
      <ul role="list" className={styles.triggers}>
        {NAV_ITEMS.map((item) => {
          const expanded = snapshot.open && snapshot.activeId === item.id
          return (
            <li key={item.id} className={styles.item}>
              <button
                ref={nav.triggerRef(item.id)}
                type="button"
                className={styles.trigger}
                aria-expanded={expanded}
                aria-controls={panelId(item.id)}
                onPointerEnter={(event) => nav.onTriggerEnter(item.id, event)}
                onPointerLeave={() => nav.onTriggerLeave(item.id)}
                onFocus={() => nav.onTriggerFocus(item.id)}
                onClick={(event) => nav.onTriggerClick(item.id, event)}
                onKeyDown={(event) => nav.onTriggerKeyDown(item.id, event)}
              >
                <span>{item.label}</span>
                <Icon name="chevron-down" size={11} className={styles.chevron} />
              </button>
            </li>
          )
        })}
      </ul>

      <NavViewport
        snapshot={snapshot}
        viewportRef={nav.viewportRef}
        panelRef={nav.panelRef}
        panelId={panelId}
        onKeyDown={nav.onPanelKeyDown}
        onClick={nav.onPanelClick}
      />
    </nav>
  )
}
