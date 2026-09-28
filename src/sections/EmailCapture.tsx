import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button, Icon, Reveal } from '../components'
import { COPY } from '../data/catalog'
import { cx } from '../lib'
import styles from './EmailCapture.module.css'

const INPUT_ID = 'list-email'
const ERROR_ID = 'list-email-error'

/** Something@something.tld: enough to catch slips like "a@b" without a backend. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/

const isEmail = (value: string) => EMAIL.test(value.trim())

/** "You are on the list." + the rest, so the first sentence can lead. */
function splitLead(text: string): [string, string] {
  const end = text.indexOf('. ')
  return end === -1 ? [text, ''] : [text.slice(0, end + 1), text.slice(end + 2)]
}

const [SUCCESS_LEAD, SUCCESS_REST] = splitLead(COPY.list.success)

/**
 * The list sign-up (#list). Validation is inline: on blur once something is typed, then live
 * on every keystroke after the first blur or submit attempt. A valid submit never leaves the
 * page (stage one has no backend): the form gives way to a status message that takes focus.
 */
export function EmailCapture() {
  const [value, setValue] = useState('')
  const [checking, setChecking] = useState(false)
  const [joined, setJoined] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const focusAfterSwap = useRef<'input' | 'status' | null>(null)

  const invalid = !isEmail(value)
  const showError = checking && invalid

  // Move focus once the form or the status message has actually rendered.
  useEffect(() => {
    const target = focusAfterSwap.current
    focusAfterSwap.current = null
    if (target === 'status') statusRef.current?.focus()
    if (target === 'input') inputRef.current?.focus()
  }, [joined])

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setChecking(true)
    if (invalid) {
      inputRef.current?.focus()
      return
    }
    focusAfterSwap.current = 'status'
    setJoined(true)
  }

  const startOver = () => {
    setValue('')
    setChecking(false)
    focusAfterSwap.current = 'input'
    setJoined(false)
  }

  return (
    <Reveal as="section" id="list" aria-labelledby="list-title" className={styles.root}>
      <div className={styles.intro}>
        <h3 id="list-title" className={cx('t-display-m', styles.title)}>
          {COPY.list.title}
        </h3>
        <p className={cx('t-body-l', styles.body)}>{COPY.list.body}</p>
      </div>

      <div className={styles.panel}>
        {joined ? (
          <div ref={statusRef} role="status" tabIndex={-1} className={styles.success}>
            <p className={styles.successLead}>{SUCCESS_LEAD}</p>
            {SUCCESS_REST ? <p className={styles.successRest}>{SUCCESS_REST}</p> : null}
            <Button variant="text" size="sm" className={styles.again} onClick={startOver}>
              Use a different email
            </Button>
          </div>
        ) : (
          <form className={styles.form} noValidate onSubmit={onSubmit}>
            <label htmlFor={INPUT_ID} className={cx('t-label', styles.label)}>
              {COPY.list.label}
            </label>
            <div className={styles.field}>
              <input
                ref={inputRef}
                id={INPUT_ID}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder={COPY.list.placeholder}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onBlur={() => {
                  if (value.trim()) setChecking(true)
                }}
                aria-invalid={showError || undefined}
                aria-describedby={showError ? ERROR_ID : undefined}
                className={styles.input}
              />
              <Button type="submit" icon={<Icon name="arrow-right" />} className={styles.submit}>
                {COPY.list.submit}
              </Button>
            </div>
            <p id={ERROR_ID} className={styles.error} aria-live="polite">
              {showError ? (
                <>
                  <span className={styles.errorDot} aria-hidden="true" />
                  <span className="visually-hidden">Error: </span>
                  {COPY.list.error}
                </>
              ) : null}
            </p>
          </form>
        )}
      </div>
    </Reveal>
  )
}
