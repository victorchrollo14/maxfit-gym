/* Membership and pause dates are plain YYYY-MM-DD days. "Today" is always the
   IST day: the server runs in UTC, which is still on yesterday until 05:30 IST. */

const istDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' })

export function todayIST() {
  return istDay.format(new Date())
}

/** The IST day a timestamp falls on. */
export function dayIST(value: string) {
  return istDay.format(new Date(value))
}

export function addDays(day: string, days: number) {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}

export function formatDay(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })
}
