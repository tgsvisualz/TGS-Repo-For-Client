import { useMemo } from 'react'
import { Countdown, Placeholder } from '../../components'
import { getNextDropDate } from '../../data/catalog'
import type { NavCard } from '../../data/types'
import styles from './panels.module.css'

export interface CardsPanelProps {
  cards: NavCard[]
}

/** The Drop: two captioned image cards side by side; the next drop's card carries its countdown. */
export function CardsPanel({ cards }: CardsPanelProps) {
  const nextDrop = useMemo(() => getNextDropDate(), [])

  return (
    <ul role="list" className={styles.cards}>
      {cards.map((card, index) => (
        <li key={card.assetId}>
          <a href={card.href} className={styles.card} data-cursor="view">
            <Placeholder assetId={card.assetId} ratio={4 / 5} decorative className={styles.cardArt}>
              <span className={styles.cardCaption}>
                <span className={styles.cardTitle}>{card.title}</span>
                {index === 0 ? <Countdown variant="inline" target={nextDrop} className={styles.cardCountdown} /> : null}
                <span className={styles.cardDesc}>{card.description}</span>
              </span>
            </Placeholder>
          </a>
        </li>
      ))}
    </ul>
  )
}
