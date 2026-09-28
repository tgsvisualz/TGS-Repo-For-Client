export type ClassValue = string | number | boolean | null | undefined

/**
 * Joins class names, skipping falsy values (and bare `true`), so conditions read inline:
 * `cx(styles.root, open && styles.open, className)`.
 */
export function cx(...classes: ClassValue[]): string {
  let out = ''
  for (const value of classes) {
    if (!value || value === true) continue
    out = out ? `${out} ${value}` : String(value)
  }
  return out
}
