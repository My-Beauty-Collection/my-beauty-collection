/**
 * Date handling on plain calendar dates ("YYYY-MM-DD") to avoid timezone drift:
 * every computation happens in UTC on midnight timestamps.
 */

const DAY_MS = 24 * 60 * 60 * 1000
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const m = ISO_DATE.exec(value)
  if (!m) return false
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3]
}

function toUtc(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/** Today's date in the user's local timezone. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS)
}

export function addDays(date: string, days: number): string {
  return fromUtc(toUtc(date) + days * DAY_MS)
}

/** Adds calendar months, clamping to the end of month (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(date: string, months: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const targetMonthIndex = m - 1 + months
  const lastDay = new Date(Date.UTC(y, targetMonthIndex + 1, 0)).getUTCDate()
  return fromUtc(Date.UTC(y, targetMonthIndex, Math.min(d, lastDay)))
}

const longFormatter = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatDate(date: string | null): string {
  return date ? longFormatter.format(new Date(toUtc(date))) : '—'
}

/** "1 giorno", "12 giorni" (sign ignored). */
export function formatDays(days: number): string {
  const n = Math.abs(days)
  return n === 1 ? '1 giorno' : `${n} giorni`
}
