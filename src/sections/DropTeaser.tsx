import { useMemo } from 'react'
import { Countdown, Placeholder, Reveal } from '../components'
import {
  COPY,
  NEXT_DROP_NUMBER,
  dropCode,
  formatDay,
  formatPrice,
  formatTime,
  getNextDropDate,
  piecesInDrop,
} from '../data/catalog'
import type { Piece } from '../data/types'
import { cx } from '../lib'
import { DropNumber, Veil } from './DropTeaser.parts'
import { EmailCapture } from './EmailCapture'
import styles from './DropTeaser.module.css'

/** The piece that leads the spread (3:4, two rows tall on desktop, first on phones). */
const FEATURE_ID = 'notte'

function featureFirst(pieces: Piece[]): Piece[] {
  const feature = pieces.find((piece) => piece.id === FEATURE_ID) ?? pieces[0]
  return feature ? [feature, ...pieces.filter((piece) => piece !== feature)] : pieces
}

const sentenceCase = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)

function PieceCard({ piece, feature }: { piece: Piece; feature: boolean }) {
  const price = formatPrice(piece.price)
  const label = `${piece.name}, ${sentenceCase(piece.kind)}, ${price}. ${COPY.drop.veiledLabel}. Get notified.`
  return (
    <li className={cx(styles.piece, feature && styles.feature)}>
      <a href="#list" className={styles.card} aria-label={label} data-cursor="peek">
        <Placeholder assetId={piece.assetId} ratio={feature ? 3 / 4 : 4 / 5} decorative className={styles.media}>
          <Veil />
        </Placeholder>
        <span className={styles.caption}>
          <span lang="it" className={styles.name}>
            {piece.name}
          </span>
          <span className={styles.gloss}>
            <i lang="it">{piece.name.toLowerCase()}</i>: {piece.gloss}
          </span>
          <span className={styles.meta}>
            <span className={styles.kind}>{piece.kind}</span>
            <span className={cx('tabular', styles.price)}>{price}</span>
          </span>
        </span>
      </a>
    </li>
  )
}

/** Drop 014: the numeral and countdown, six veiled pieces in an asymmetric spread, the list. */
export function DropTeaser() {
  const unveil = useMemo(() => getNextDropDate(), [])
  const pieces = useMemo(() => featureFirst(piecesInDrop(NEXT_DROP_NUMBER)), [])

  return (
    <section id="drop" aria-labelledby="drop-title" className={cx('section', styles.root)}>
      <div className="container">
        <Reveal className={styles.header}>
          <p className={cx('t-label', styles.eyebrow)}>{COPY.drop.eyebrow}</p>
          <h2 id="drop-title" className={styles.title}>
            <DropNumber number={NEXT_DROP_NUMBER} />
          </h2>
          <p className={cx('t-label', styles.when)}>
            <span className={styles.whenLead}>Unveils</span>
            <time dateTime={unveil.toISOString()}>
              {formatDay(unveil)} · {formatTime(unveil)}
            </time>
          </p>
          <div className={styles.clock}>
            <Countdown target={unveil} variant="large" className={styles.countdown} />
          </div>
          <p className={cx('t-body-l', styles.lede)}>{COPY.drop.lede}</p>
        </Reveal>

        <Reveal
          as="ul"
          role="list"
          stagger
          className={styles.grid}
          aria-label={`Drop ${dropCode(NEXT_DROP_NUMBER)}, ${pieces.length} veiled pieces`}
        >
          {pieces.map((piece, i) => (
            <PieceCard key={piece.id} piece={piece} feature={i === 0} />
          ))}
        </Reveal>

        <EmailCapture />
      </div>
    </section>
  )
}
