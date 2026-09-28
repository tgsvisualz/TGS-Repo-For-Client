import type { KeyboardEvent, MouseEvent, RefObject } from 'react'
import { NAV_ITEMS } from '../data/catalog'
import type { NavItem, NavItemId } from '../data/types'
import styles from './DesktopNav.module.css'
import { CardsPanel } from './panels/CardsPanel'
import { ListPanel } from './panels/ListPanel'
import { ListPreviewPanel } from './panels/ListPreviewPanel'
import type { NavSnapshot } from './useNavController'

export interface NavViewportProps {
  snapshot: NavSnapshot
  viewportRef: RefObject<HTMLDivElement | null>
  panelRef: (id: NavItemId) => (el: HTMLElement | null) => void
  panelId: (id: NavItemId) => string
  onKeyDown: (event: KeyboardEvent) => void
  onClick: (event: MouseEvent) => void
}

function PanelContent({ item, active }: { item: NavItem; active: boolean }) {
  switch (item.layout) {
    case 'cards':
      return <CardsPanel cards={item.cards} />
    case 'list-preview':
      return <ListPreviewPanel categoryId={item.id} viewAll={item.viewAll} active={active} />
    case 'list':
      return <ListPanel links={item.links} />
  }
}

/**
 * The ONE floating glass viewport under the header. Every panel is pre-rendered inside it,
 * stacked at its top-left; the active one shows, the others wait to the side they would slide
 * in from (before/after the active trigger), so a switch always travels in the direction of
 * the pointer. Geometry (--vp-x/-w/-h/-origin) and data-state/data-motion are written by
 * useNavController, never by React, so running transitions are never reset by a render.
 */
export function NavViewport({ snapshot, viewportRef, panelRef, panelId, onKeyDown, onClick }: NavViewportProps) {
  const { open, activeId, mounted } = snapshot
  const activeIndex = NAV_ITEMS.findIndex((item) => item.id === activeId)

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      data-nav-viewport=""
      inert={!open}
      onKeyDown={onKeyDown}
      onClick={onClick}
    >
      <div className={styles.surface}>
        {NAV_ITEMS.map((item, index) => {
          const active = item.id === activeId
          const side = active || activeIndex < 0 ? undefined : index < activeIndex ? 'before' : 'after'
          return (
            <div
              key={item.id}
              ref={panelRef(item.id)}
              id={panelId(item.id)}
              className={styles.panel}
              role="group"
              aria-label={item.label}
              data-panel={item.id}
              data-active={active ? 'true' : 'false'}
              data-side={side}
              inert={!(open && active)}
            >
              {mounted ? <PanelContent item={item} active={open && active} /> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
