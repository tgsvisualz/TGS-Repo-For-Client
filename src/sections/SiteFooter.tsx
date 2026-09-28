import { useMemo, type CSSProperties } from 'react'
import { Button, Countdown, Icon, Wordmark } from '../components'
import { COPY, NAV_ITEMS, NEXT_DROP_NUMBER, formatDay, formatTime, getNextDropDate } from '../data/catalog'
import type { NavItem, NavLink } from '../data/types'
import { cx } from '../lib'
import { DropNumber } from './DropTeaser.parts'
import styles from './SiteFooter.module.css'

type HouseItem = Extract<NavItem, { id: 'house' }>

/** The House links, shared with the nav: The Veil, How drops work, The Index, Join the list. */
const HOUSE_LINKS: NavLink[] = NAV_ITEMS.find((item): item is HouseItem => item.id === 'house')?.links ?? []

/** The back-to-top arrow points up and nudges up on hover. */
const UP_NUDGE = { '--icon-nudge-x': '0px', '--icon-nudge-y': '-2px' } as CSSProperties

/** Footer: four columns, the legal line, and the wordmark cropped by the bottom of the page. */
export function SiteFooter() {
  const unveil = useMemo(() => getNextDropDate(), [])

  return (
    <footer id="footer" className={styles.root}>
      <div className={cx('container', styles.inner)}>
        <p className={styles.line}>{COPY.footer.line}</p>

        <div className={styles.columns}>
          <div className={styles.col}>
            <h2 className={cx('t-label', styles.heading)}>Client care</h2>
            <ul role="list" className={styles.lines}>
              {COPY.footer.care.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <nav aria-labelledby="footer-house" className={styles.col}>
            <h2 id="footer-house" className={cx('t-label', styles.heading)}>
              The House
            </h2>
            <ul role="list" className={styles.links}>
              {HOUSE_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={styles.link}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.col}>
            <h2 className={cx('t-label', styles.heading)}>Follow</h2>
            <ul role="list" className={styles.lines}>
              {COPY.footer.socials.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
            <p className={styles.note}>{COPY.footer.socialsNote}</p>
          </div>

          <div className={styles.col}>
            <h2 className={cx('t-label', styles.heading)}>Next drop</h2>
            <p className={styles.next}>
              <DropNumber number={NEXT_DROP_NUMBER} />
            </p>
            <p className={styles.when}>
              <time dateTime={unveil.toISOString()}>
                {formatDay(unveil)} · {formatTime(unveil)}
              </time>
            </p>
            <p className={styles.countdownLine}>
              <span className={styles.countdownLead}>Unveils in</span>
              <Countdown target={unveil} variant="inline" className={styles.countdown} />
            </p>
          </div>
        </div>

        <div className={styles.base}>
          <p className={cx('t-caption', styles.legal)}>
            <span>{COPY.footer.legal}</span>
            <span className={styles.dot} aria-hidden="true">
              ·
            </span>
            <span>{COPY.footer.prototype}</span>
          </p>
          <Button
            variant="text"
            size="sm"
            href="#top"
            icon={<Icon name="arrow-right" className={styles.up} />}
            style={UP_NUDGE}
            className={styles.top}
          >
            Back to top
          </Button>
        </div>
      </div>

      <div className={styles.mark} aria-hidden="true">
        <div className={styles.markCrop}>
          <Wordmark size="footer" className={styles.wordmark} />
        </div>
      </div>
    </footer>
  )
}
