import { useId } from 'react'
import { Icon } from '../components'
import { NAV_ITEMS } from '../data/catalog'
import type { NavItem, NavItemId } from '../data/types'
import styles from './DesktopNav.module.css'
import { NavViewport } from './NavViewport'
import { primaryAssets, useArtGate, warmOrder } from './useArtGate'
import { useNavController } from './useNavController'

const NAV_IDS: readonly NavItemId[] = NAV_ITEMS.map((item) => item.id)
const WARM_ORDER = warmOrder(NAV_ITEMS)

/**
 * Desktop primary nav (≥ BREAKPOINTS.nav): disclosure triggers centred in the header and the
 * shared mega-dropdown viewport. Hover-driven on fine pointers; click toggles; full keyboard
 * support (Enter/Space/↓ open instantly into the panel, ←/→ between triggers, Esc closes).
 */
export function DesktopNav() {
  const nav = useNavController(NAV_IDS)
  const art = useArtGate(WARM_ORDER)
  const { snapshot } = nav
  const baseId = useId()
  const panelId = (id: NavItemId) => `${baseId}-panel-${id}`

  /** First contact with the nav: mount the panels, start warming their art. */
  const wake = () => {
    nav.mount()
    art.warm()
  }
  /** Reaching for a trigger: its panel's first art mounts now, ahead of the 70ms hover intent. */
  const prime = (item: NavItem) => art.gate.request(primaryAssets(item))

  return (
    <nav
      ref={nav.navRef}
      aria-label="Primary"
      className={styles.nav}
      onPointerEnter={(event) => {
        wake()
        nav.onZoneEnter(event)
      }}
      onPointerLeave={nav.onZoneLeave}
      onFocus={wake}
      onBlur={nav.onNavBlur}
    >
      <ul role="list" className={styles.triggers} data-instant={snapshot.motion === 'instant' ? '' : undefined}>
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
                onPointerEnter={(event) => {
                  prime(item)
                  nav.onTriggerEnter(item.id, event)
                }}
                onPointerLeave={() => nav.onTriggerLeave(item.id)}
                onFocus={() => {
                  prime(item)
                  nav.onTriggerFocus(item.id)
                }}
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
        art={art.gate}
        viewportRef={nav.viewportRef}
        panelRef={nav.panelRef}
        panelId={panelId}
        onKeyDown={nav.onPanelKeyDown}
        onClick={nav.onPanelClick}
      />
    </nav>
  )
}
