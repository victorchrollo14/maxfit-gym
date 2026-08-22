export type Lead = {
  id: string
  name: string
  phone: string
  email: string | null
  source: string
  status: string
  notes: string | null
  converted_at: string | null
  created_at: string
}

export const LEAD_COLUMNS = [
  { value: 'new', label: 'New' },
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
] as const

/* `converted` is set by the conversion flow, not by hand: the table's check
   constraint ties it to converted_at. */
export const SETTABLE_STATUSES = ['new', 'hot', 'warm', 'cold', 'lost'] as const

export const SOURCES = [
  'walk_in',
  'call',
  'whatsapp',
  'referral',
  'free_trial',
] as const

export const sourceLabel: Record<string, string> = {
  walk_in: 'Walk-in',
  call: 'Call',
  whatsapp: 'WhatsApp',
  referral: 'Referral',
  free_trial: 'Free trial',
}

export const columnAccent: Record<string, string> = {
  new: 'bg-accent',
  hot: 'bg-danger',
  warm: 'bg-warning',
  cold: 'bg-muted',
  converted: 'bg-success',
  lost: 'bg-muted',
}

export const LEAD_FIELDS =
  'id, name, phone, email, source, status, notes, converted_at, created_at'

export function prettyPhone(phone: string) {
  const match = /^\+91(\d{5})(\d{5})$/.exec(phone)
  return match ? `+91 ${match[1]} ${match[2]}` : phone
}

export function waHref(phone: string) {
  return `https://wa.me/${phone.replace('+', '')}`
}

export function shortDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

export function fullDate(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function dayBounds(day: string) {
  const start = new Date(`${day}T00:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { from: start.toISOString(), to: end.toISOString() }
}

export function todayLocal() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 10)
}
