import type { KeyboardEvent, MouseEvent, RefObject } from 'react'
import { NAV_ITEMS } from '../data/catalog'
import type { NavItem, NavItemId } from '../data/types'
import styles from './DesktopNav.module.css'
import { CardsPanel } from './panels/CardsPanel'
import { ListPanel } from './panels/ListPanel'
import { ListPreviewPanel } from './panels/ListPreviewPanel'
import type { ArtGate } from './useArtGate'
import type { NavSnapshot } from './useNavController'

export interface NavViewportProps {
  snapshot: NavSnapshot
  art: ArtGate
  viewportRef: RefObject<HTMLDivElement | null>
  panelRef: (id: NavItemId) => (el: HTMLElement | null) => void
  panelId: (id: NavItemId) => string
  onKeyDown: (event: KeyboardEvent) => void
  onClick: (event: MouseEvent) => void
}

function PanelContent({ item, active, art }: { item: NavItem; active: boolean; art: ArtGate }) {
  switch (item.layout) {
    case 'cards':
      return <CardsPanel cards={item.cards} active={active} art={art} />
    case 'list-preview':
      return <ListPreviewPanel categoryId={item.id} viewAll={item.viewAll} active={active} art={art} />
    case 'list':
      return <ListPanel links={item.links} />
  }
}

/**
 * The ONE floating glass viewport under the header. Every panel is pre-rendered inside it,
 * stacked at its top-left; the active one shows. The others rest 12px to one side, by their
 * trigger's position relative to the active one (data-side), so on a switch the incoming
 * panel slides in, and the outgoing one slides out, in the direction of travel.
 * Geometry (--vp-x/-w/-h/-origin) and data-state/data-motion are written by useNavController,
 * never by React, so a render never resets a running transition.
 */
export function NavViewport({ snapshot, art, viewportRef, panelRef, panelId, onKeyDown, onClick }: NavViewportProps) {
  const { open, activeId, mounted } = snapshot
  const activeIndex = NAV_ITEMS.findIndex((item) => item.id === activeId)

  return (
    <div
      ref={viewportRef}
      className={styles.viewport}
      data-nav-viewport=""
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
              // Only the open, active panel is interactive. (Kept per panel, never on the whole
              // viewport: inert is inherited, and toggling it there restyles every panel.)
              inert={!(open && active)}
            >
              {mounted ? <PanelContent item={item} active={open && active} art={art} /> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
