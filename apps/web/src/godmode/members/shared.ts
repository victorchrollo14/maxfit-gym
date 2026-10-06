import { getSupabase } from '@/lib/supabase'

export type Profile = {
  id: string
  name: string
  phone: string | null
  email: string | null
  phone_verified_at: string | null
  gender: string | null
  dob: string | null
  notes: string | null
  created_at: string
}

export const PROFILE_FIELDS =
  'id, name, phone, email, phone_verified_at, gender, dob, notes, created_at'

export type MembershipStatus = 'active' | 'paused' | 'upcoming' | 'expired' | 'cancelled'

/** A row of the membership_summary view. */
export type Membership = {
  membership_id: string
  member_ids: string[] | null
  plan_key: string
  plan_name: string
  status: MembershipStatus
  expiring_soon: boolean
  start_date: string
  end_date: string
  days_left: number
  price: number
  discount_amount: number
  discount_reason: string | null
  amount_due: number
  amount_paid: number
  amount_pending: number
  pause_days_allowed: number
  pause_days_used: number
  pause_days_left: number
  cancelled_at: string | null
  cancel_reason: string | null
  created_at: string
}

export type Payment = {
  id: string
  membership_id: string
  paid_by: string
  amount: number
  method: string
  reference_id: string | null
  status: string
  paid_at: string
  note: string | null
  void_reason: string | null
}

export const PAYMENT_FIELDS =
  'id, membership_id, paid_by, amount, method, reference_id, status, paid_at, note, void_reason'

export const statusLabel: Record<MembershipStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  upcoming: 'Upcoming',
  expired: 'Expired',
  cancelled: 'Cancelled',
}

export const statusColor: Record<MembershipStatus, 'success' | 'warning' | 'accent' | 'danger' | 'default'> = {
  active: 'success',
  paused: 'warning',
  upcoming: 'accent',
  expired: 'danger',
  cancelled: 'default',
}

export const genderLabel: Record<string, string> = {
  female: 'Female',
  male: 'Male',
  other: 'Other',
}

export const methodLabel: Record<string, string> = {
  upi: 'UPI',
  cash: 'Cash',
  card: 'Card',
}

/* Full class strings, so Tailwind finds them. Tints are translucent to suit both themes. */
const PLAN_TONES: Record<string, { bar: string; tint: string; text: string }> = {
  monthly: { bar: 'bg-sky-500', tint: 'bg-sky-500/10', text: 'text-sky-700 dark:text-sky-300' },
  quarterly: { bar: 'bg-violet-500', tint: 'bg-violet-500/10', text: 'text-violet-700 dark:text-violet-300' },
  half_yearly: { bar: 'bg-amber-500', tint: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300' },
  annual: { bar: 'bg-emerald-500', tint: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300' },
  couple: { bar: 'bg-rose-500', tint: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-300' },
}

export function planTone(planKey: string) {
  return PLAN_TONES[planKey] ?? { bar: 'bg-muted', tint: 'bg-surface-secondary', text: '' }
}

const statusOrder: Record<MembershipStatus, number> = {
  active: 0,
  paused: 0,
  upcoming: 1,
  expired: 2,
  cancelled: 3,
}

/** Running first, then upcoming, then the most recent past one. */
export function sortMemberships(list: Membership[]) {
  return [...list].sort(
    (a, b) =>
      statusOrder[a.status] - statusOrder[b.status] ||
      (a.status === 'upcoming'
        ? a.start_date.localeCompare(b.start_date)
        : b.end_date.localeCompare(a.end_date)),
  )
}

export function currentMembership(list: Membership[]) {
  return sortMemberships(list).find((m) => m.status !== 'cancelled') ?? null
}

export type MemberRow = {
  profile: Profile
  /** All of the member's passes, cancelled ones included. */
  passes: Membership[]
  current: Membership | null
  /** Every live pass with money still owed, the current one first. */
  dues: Membership[]
  dueTotal: number
}

export function memberRows(profiles: Profile[], memberships: Membership[]): MemberRow[] {
  const byMember = new Map<string, Membership[]>()
  for (const m of memberships) {
    for (const id of m.member_ids ?? []) {
      byMember.set(id, [...(byMember.get(id) ?? []), m])
    }
  }
  return profiles.map((profile) => {
    const passes = byMember.get(profile.id) ?? []
    const dues = sortMemberships(passes).filter((m) => m.status !== 'cancelled' && m.amount_pending > 0)
    return {
      profile,
      passes,
      current: currentMembership(passes),
      dues,
      dueTotal: dues.reduce((sum, m) => sum + Number(m.amount_pending), 0),
    }
  })
}

const BATCH = 1000

/** PostgREST returns at most 1000 rows a request, so read in batches until a short one. */
export async function fetchAll<T>(
  batch: (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>,
) {
  const rows: T[] = []
  for (let from = 0; ; from += BATCH) {
    const { data, error } = await batch(from, from + BATCH - 1)
    if (error) throw error
    rows.push(...((data ?? []) as T[]))
    if (!data || data.length < BATCH) return rows
  }
}

/** Members are the profiles Add member created; staff and half-finished sign-ups aren't. */
export function loadMembers() {
  return fetchAll<Profile>((from, to) =>
    getSupabase()
      .from('user_profiles')
      .select(PROFILE_FIELDS)
      .not('created_by', 'is', null)
      .order('name')
      .order('id')
      .range(from, to),
  )
}

export function loadMembershipSummary() {
  return fetchAll<Membership>((from, to) =>
    getSupabase().from('membership_summary').select('*').order('membership_id').range(from, to),
  )
}

export function errorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : 'Something went wrong'
}

export function matchesSearch(profile: Profile, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  const digits = needle.replace(/\D/g, '')
  return (
    profile.name.toLowerCase().includes(needle) ||
    (digits.length > 0 && (profile.phone ?? '').includes(digits))
  )
}
