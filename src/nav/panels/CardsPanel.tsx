import { useLayoutEffect, useMemo } from 'react'
import { Countdown, Placeholder, StatusChip } from '../../components'
import { NEXT_DROP_NUMBER, getDrops, getNextDropDate } from '../../data/catalog'
import type { NavCard } from '../../data/types'
import type { ArtGate } from '../useArtGate'
import styles from './panels.module.css'

export interface CardsPanelProps {
  cards: NavCard[]
  active: boolean
  art: ArtGate
}

/**
 * The Drop: two captioned image cards side by side. Each caption reads title · status · line:
 * the next drop counts down, the live one says how much is left.
 */
export function CardsPanel({ cards, active, art }: CardsPanelProps) {
  const nextDrop = useMemo(() => getNextDropDate(), [])
  const liveDrop = useMemo(() => getDrops().find((drop) => drop.number === NEXT_DROP_NUMBER - 1), [])
  const { request } = art

  useLayoutEffect(() => {
    if (active) request(cards.map((card) => card.assetId))
  }, [active, cards, request])

  return (
    <ul role="list" className={styles.cards}>
      {cards.map((card, index) => (
        <li key={card.assetId}>
          <a href={card.href} className={styles.card} data-cursor="view">
            {art.has(card.assetId) ? (
              <Placeholder assetId={card.assetId} ratio={4 / 5} decorative className={styles.cardArt} />
            ) : (
              <span className={styles.cardArt} aria-hidden="true" />
            )}
            <span className={styles.cardCaption}>
              <span className={styles.cardTitle}>{card.title}</span>
              <span className={styles.cardMeta}>
                {index === 0 ? (
                  <Countdown variant="inline" target={nextDrop} className={styles.cardCountdown} />
                ) : liveDrop && liveDrop.status === 'live' ? (
                  <StatusChip status="live">
                    {liveDrop.available} of {liveDrop.pieces} left
                  </StatusChip>
                ) : null}
              </span>
              <span className={styles.cardDesc}>{card.description}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
