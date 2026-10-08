export const STATUS_KEYS = [
  'active',
  'paused',
  'upcoming',
  'expiring_today',
  'expiring_3',
  'expiring_7',
  'expired',
  'none',
] as const
export const PAY_KEYS = ['complete', 'partial', 'none', 'dues'] as const
export const SORT_KEYS = ['name', 'plan', 'start', 'end', 'left', 'status', 'total', 'paid', 'due', 'joined'] as const
export const PAGE_SIZES = [25, 50, 100] as const

export type StatusKey = (typeof STATUS_KEYS)[number]
export type PayKey = (typeof PAY_KEYS)[number]
export type SortKey = (typeof SORT_KEYS)[number]

/** The members list's search params. Missing means the default. */
export type MemberFilters = {
  q?: string
  status?: StatusKey[]
  plan?: string[]
  gender?: string[]
  pay?: PayKey[]
  startFrom?: string
  startTo?: string
  endFrom?: string
  endTo?: string
  joinedFrom?: string
  joinedTo?: string
  sort?: SortKey
  desc?: boolean
  page?: number
  size?: number
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

function oneOf<T extends string>(keys: readonly T[], value: unknown) {
  return keys.includes(value as T) ? (value as T) : undefined
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined
}

/** A list param, accepting a single value too. */
function list<T extends string>(value: unknown, keys?: readonly T[]) {
  const items = (Array.isArray(value) ? value : [value]).filter(
    (item): item is T => typeof item === 'string' && item !== '' && (!keys || keys.includes(item as T)),
  )
  return items.length ? [...new Set(items)] : undefined
}

function day(value: unknown) {
  return typeof value === 'string' && DAY.test(value) ? value : undefined
}

export function parseMemberFilters(search: Record<string, unknown>): MemberFilters {
  const page = Number(search.page)
  const size = Number(search.size)
  const filters: MemberFilters = {
    q: text(search.q),
    status: list(search.status, STATUS_KEYS),
    plan: list(search.plan),
    gender: list(search.gender),
    pay: list(search.pay, PAY_KEYS),
    startFrom: day(search.startFrom),
    startTo: day(search.startTo),
    endFrom: day(search.endFrom),
    endTo: day(search.endTo),
    joinedFrom: day(search.joinedFrom),
    joinedTo: day(search.joinedTo),
    sort: oneOf(SORT_KEYS, search.sort),
    desc: search.desc === true || search.desc === 'true' || undefined,
    page: Number.isInteger(page) && page > 1 ? page : undefined,
    size: PAGE_SIZES.includes(size as (typeof PAGE_SIZES)[number]) ? size : undefined,
  }
  return Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined))
}
