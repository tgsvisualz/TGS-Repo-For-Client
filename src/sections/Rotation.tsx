import { useMemo } from 'react'
import { Placeholder, Reveal, SectionHeading, StatusChip } from '../components'
import { DATE_LOCALE, DROP_SCHEDULE } from '../config'
import { COPY, dropCode, formatDay, formatTime, getDrops, piecesInDrop, stockLabel } from '../data/catalog'
import type { Drop, DropStatus, Piece } from '../data/types'
import { cx } from '../lib'
import { DropNumber, Veil } from './DropTeaser.parts'
import styles from './Rotation.module.css'

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen']

const inWords = (n: number) => NUMBER_WORDS[n] ?? String(n)
const clock = (hours: number, minutes: number) => `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
/** 0 = Sunday … 6 = Saturday, named in the site's locale (7 Jan 2024 was a Sunday). */
const weekdayName = (weekday: number) =>
  new Intl.DateTimeFormat(DATE_LOCALE, { weekday: 'long' }).format(new Date(2024, 0, 7 + weekday))

/** "Each drop is live for ten days: unveiled on a Thursday at 20:00, gone on the Sunday after next at 23:59." */
function scheduleLine(): string {
  const s = DROP_SCHEDULE
  const leaveWeekday = (s.unveilWeekday + s.liveDays) % 7
  const firstLeave = (leaveWeekday - s.unveilWeekday + 7) % 7 || 7
  const which = s.liveDays > firstLeave ? ' after next' : ''
  return (
    `Each drop is live for ${inWords(s.liveDays)} days: ` +
    `unveiled on a ${weekdayName(s.unveilWeekday)} at ${clock(s.unveilHour, s.unveilMinute)}, ` +
    `gone on the ${weekdayName(leaveWeekday)}${which} at ${clock(s.leaveHour, s.leaveMinute)}.`
  )
}

const CHIP: Record<DropStatus, string> = { veiled: 'Veiled', live: 'Live', archived: 'Archived' }

function DateLine({ drop }: { drop: Drop }) {
  if (drop.status === 'veiled') {
    return (
      <>
        Unveils <time dateTime={drop.unveil.toISOString()}>{`${formatDay(drop.unveil)}, ${formatTime(drop.unveil)}`}</time>
      </>
    )
  }
  if (drop.status === 'live') {
    return (
      <>
        Leaves <time dateTime={drop.leaves.toISOString()}>{`${formatDay(drop.leaves)}, ${formatTime(drop.leaves)}`}</time>
      </>
    )
  }
  return (
    <>
      Closed <time dateTime={drop.leaves.toISOString()}>{formatDay(drop.leaves)}</time>
    </>
  )
}

function availability(drop: Drop): string {
  if (drop.status === 'veiled') return `${drop.pieces} pieces, veiled`
  if (drop.status === 'live') {
    return drop.available > 0 ? `${drop.available} of ${drop.pieces} pieces left` : `All ${drop.pieces} pieces gone`
  }
  return 'Gone for good'
}

function Thumb({ piece }: { piece: Piece }) {
  const veiled = piece.status === 'veiled'
  const faded = piece.status === 'sold-out' || piece.status === 'archived'
  return (
    <li className={cx(styles.thumb, faded && styles.faded)}>
      <Placeholder assetId={piece.assetId} ratio={4 / 5} decorative={veiled} className={styles.thumbMedia}>
        {veiled ? <Veil label={false} /> : null}
      </Placeholder>
      <p lang="it" className={styles.thumbName}>
        {piece.name}
      </p>
      <StatusChip status={piece.status} className={styles.thumbChip}>
        {stockLabel(piece)}
      </StatusChip>
    </li>
  )
}

function DropRow({ drop }: { drop: Drop }) {
  const pieces = piecesInDrop(drop.number)
  return (
    <li className={cx(styles.row, styles[drop.status])}>
      <div className={styles.id}>
        <h3 className={styles.numeral}>
          <DropNumber number={drop.number} />
        </h3>
        <StatusChip status={drop.status}>{CHIP[drop.status]}</StatusChip>
      </div>
      <p className={styles.facts}>
        <span className={styles.date}>
          <DateLine drop={drop} />
        </span>
        <span className={styles.availability}>{availability(drop)}</span>
      </p>
      {pieces.length ? (
        <ul role="list" className={styles.strip} aria-label={`Pieces in Drop ${dropCode(drop.number)}`}>
          {pieces.map((piece) => (
            <Thumb key={piece.id} piece={piece} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

/** "Pieces arrive on Thursday. <em>Some leave on Sunday.</em>": the one italic accent. */
function accentLastSentence(text: string) {
  const cut = text.lastIndexOf('. ', text.length - 2)
  if (cut === -1) return text
  return (
    <>
      {text.slice(0, cut + 1)} <em>{text.slice(cut + 2)}</em>
    </>
  )
}

/** This week: the drop sequence (next, live, archived), each row with its pieces. */
export function Rotation() {
  const drops = useMemo(() => getDrops(), [])
  const lede = useMemo(() => scheduleLine(), [])

  return (
    <section id="rotation" aria-labelledby="rotation-title" className={cx('section', styles.root)}>
      <div className="container">
        <Reveal>
          <SectionHeading
            eyebrow={COPY.rotation.eyebrow}
            title={accentLastSentence(COPY.rotation.title)}
            lede={lede}
            titleId="rotation-title"
            className={styles.heading}
          />
        </Reveal>

        <Reveal as="ol" role="list" stagger className={styles.rows}>
          {drops.map((drop) => (
            <DropRow key={drop.number} drop={drop} />
          ))}
        </Reveal>
      </div>
    </section>
  )
}
