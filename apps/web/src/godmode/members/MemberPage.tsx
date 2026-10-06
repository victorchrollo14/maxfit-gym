import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Alert, Button, Chip, Spinner, Toast, cn } from '@heroui/react'
import { LuArrowLeft, LuBadgeCheck, LuCopy, LuPencil, LuPhone, LuPlus } from 'react-icons/lu'
import { FaWhatsapp } from 'react-icons/fa'
import { getSupabase } from '@/lib/supabase'
import { daysBetween, formatDateTime, formatDay } from '@/lib/dates'
import { formatINR } from '@/lib/format'
import { PageHeader } from '@/godmode/PageHeader'
import { prettyPhone, waHref } from '@/godmode/leads/shared'
import { EditMember } from './EditMember'
import { NewMembership } from './NewMembership'
import { RecordPayment } from './RecordPayment'
import { VoidPayment } from './VoidPayment'
import {
  PAYMENT_FIELDS,
  PROFILE_FIELDS,
  genderLabel,
  methodLabel,
  planTone,
  sortMemberships,
  statusColor,
  statusLabel,
  type Membership,
  type Payment,
  type Profile,
} from './shared'

function Fact({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: string
  hint?: string | null
  className?: string
}) {
  return (
    <div>
      <p className="eyebrow text-[10px] text-muted">{label}</p>
      <p className={cn('mt-0.5 text-sm tabular-nums', className)}>{value}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

/* The Clipboard API needs a secure context, so fall back to a hidden textarea. */
async function copyId(id: string) {
  let copied = false
  try {
    await navigator.clipboard.writeText(id)
    copied = true
  } catch {
    const area = document.createElement('textarea')
    area.value = id
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    copied = document.execCommand('copy')
    area.remove()
  }
  if (copied) Toast.toast.success('Membership ID copied')
  else Toast.toast.danger(`Couldn't copy. The ID is ${id}`)
}

function MembershipCard({
  membership,
  payments,
  names,
  memberId,
  onRecord,
  onVoid,
}: {
  membership: Membership
  payments: Payment[]
  names: Map<string, string>
  memberId: string
  onRecord: () => void
  onVoid: (payment: Payment) => void
}) {
  const m = membership
  const partners = (m.member_ids ?? []).filter((id) => id !== memberId)
  const live = m.status !== 'cancelled'
  const pending = Number(m.amount_pending)
  const discount = Number(m.discount_amount)
  const totalDays = daysBetween(m.start_date, m.end_date) + 1
  const tone = planTone(m.plan_key)

  return (
    <article
      className={cn('overflow-hidden rounded-xl border border-border bg-surface', !live && 'opacity-70')}
    >
      <div className={cn('flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3', tone.tint)}>
        <div className="flex items-start gap-3">
          <span className={cn('mt-1 h-9 w-1 shrink-0 rounded-full', tone.bar)} />
          <div>
            <div className="flex items-center gap-1">
              <h3 className={cn('font-semibold', tone.text)}>{m.plan_name}</h3>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label="Copy membership ID"
                className="size-7 min-w-7 text-muted"
                onPress={() => copyId(m.membership_id)}
              >
                <LuCopy className="size-3.5" />
              </Button>
            </div>
            <p className="text-sm text-muted">
              {formatDay(m.start_date)} – {formatDay(m.end_date)}
              {(m.status === 'active' || m.status === 'paused') && ` · ${m.days_left} days left`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip size="sm" variant="soft" color={statusColor[m.status]}>
            {statusLabel[m.status]}
          </Chip>
          {m.expiring_soon && (
            <Chip size="sm" variant="soft" color="warning">
              Expiring
            </Chip>
          )}
        </div>
      </div>

      <div className="p-4">
      {partners.length > 0 && (
        <p className="mb-4 text-sm text-muted">
          With{' '}
          {partners.map((id, index) => (
            <span key={id}>
              {index > 0 && ', '}
              <Link to="/godmode/members/$memberId" params={{ memberId: id }} className="underline">
                {names.get(id) ?? 'member'}
              </Link>
            </span>
          ))}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Fact label="Total days" value={String(totalDays)} />
        <Fact
          label="Pause days"
          value={m.pause_days_allowed > 0 ? String(m.pause_days_allowed) : 'None'}
          hint={m.pause_days_used > 0 ? `${m.pause_days_used} used` : null}
        />
        <Fact label="Total amount" value={formatINR(Number(m.price))} />
        <Fact
          label="Discount"
          value={discount > 0 ? formatINR(discount) : 'None'}
          hint={discount > 0 ? m.discount_reason : null}
        />
      </div>
      {m.cancel_reason && <p className="mt-3 text-xs text-muted">Cancelled: {m.cancel_reason}</p>}

      <section className="mt-5 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">Payments</h4>
            {live && (
              <Chip size="sm" variant="soft" color={pending > 0 ? 'danger' : 'success'}>
                {pending <= 0 ? 'Paid' : Number(m.amount_paid) > 0 ? 'Part paid' : 'Unpaid'}
              </Chip>
            )}
          </div>
          {live && pending > 0 && (
            <Button size="sm" variant="secondary" onPress={onRecord}>
              <LuPlus className="size-4" />
              Add payment
            </Button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <Fact label="Amount due" value={formatINR(Number(m.amount_due))} />
          <Fact
            label="Paid"
            value={formatINR(Number(m.amount_paid))}
            className={m.amount_paid > 0 ? 'font-medium text-success' : undefined}
          />
          <Fact
            label="Pending"
            value={formatINR(Math.max(pending, 0))}
            className={live && pending > 0 ? 'font-medium text-danger' : undefined}
          />
        </div>

        {payments.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No payments yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface-secondary/40">
            {payments.map((p) => {
              const isVoid = p.status === 'void'
              return (
                <li key={p.id} className="flex items-start gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className={cn('tabular-nums', isVoid && 'line-through text-muted')}>
                      {formatINR(Number(p.amount))} · {methodLabel[p.method] ?? p.method}
                      {p.reference_id && <span className="text-muted"> · {p.reference_id}</span>}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDateTime(p.paid_at)}
                      {partners.length > 0 && ` · paid by ${names.get(p.paid_by) ?? 'member'}`}
                      {p.note && ` · ${p.note}`}
                    </p>
                    {isVoid && <p className="text-xs text-danger">Cancelled: {p.void_reason}</p>}
                  </div>
                  {p.status === 'paid' && (
                    <Button size="sm" variant="ghost" onPress={() => onVoid(p)}>
                      Cancel payment
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
      </div>
    </article>
  )
}

export function MemberPage({ memberId, sell }: { memberId: string; sell?: boolean }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [names, setNames] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [selling, setSelling] = useState(false)
  const [editing, setEditing] = useState(false)
  const [paying, setPaying] = useState<Membership | null>(null)
  const [voiding, setVoiding] = useState<Payment | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabase()
    try {
      const [{ data: person, error }, { data: seats, error: seatsError }] = await Promise.all([
        supabase.from('user_profiles').select(PROFILE_FIELDS).eq('id', memberId).maybeSingle(),
        supabase.from('membership_users').select('membership_id').eq('user_id', memberId),
      ])
      if (error) throw error
      if (seatsError) throw seatsError
      setProfile(person as Profile | null)

      const ids = seats.map((seat) => seat.membership_id)
      if (ids.length === 0) {
        setMemberships([])
        setPayments([])
      } else {
        const [summary, paid] = await Promise.all([
          supabase.from('membership_summary').select('*').in('membership_id', ids),
          supabase
            .from('payments')
            .select(PAYMENT_FIELDS)
            .in('membership_id', ids)
            .order('paid_at', { ascending: false }),
        ])
        if (summary.error) throw summary.error
        if (paid.error) throw paid.error
        const list = summary.data as Membership[]
        setMemberships(list)
        setPayments(paid.data as Payment[])

        const others = [...new Set(list.flatMap((m) => m.member_ids ?? []))].filter((id) => id !== memberId)
        if (others.length > 0) {
          const { data } = await supabase.from('user_profiles').select('id, name').in('id', others)
          setNames(new Map((data ?? []).map((p) => [p.id, p.name])))
        }
      }
    } catch (error) {
      console.error('member load failed', error)
      Toast.toast.danger('Could not load this member.')
    }
    setLoading(false)
  }, [memberId])

  useEffect(() => {
    load()
  }, [load])

  // Straight after Add member, the membership form opens on its own (D13).
  useEffect(() => {
    if (!sell) return
    setSelling(true)
    navigate({ to: '.', search: {}, replace: true })
  }, [sell, navigate])

  /* Old passes that still owe money come before old ones that are settled. */
  const sorted = useMemo(() => {
    const list = sortMemberships(memberships)
    const expired = list.filter((m) => m.status === 'expired')
    return [
      ...list.filter((m) => m.status !== 'expired' && m.status !== 'cancelled'),
      ...expired.filter((m) => m.amount_pending > 0),
      ...expired.filter((m) => m.amount_pending <= 0),
      ...list.filter((m) => m.status === 'cancelled'),
    ]
  }, [memberships])
  const dues = sorted.filter((m) => m.status !== 'cancelled' && m.amount_pending > 0)
  const dueTotal = dues.reduce((sum, m) => sum + Number(m.amount_pending), 0)
  const allNames = useMemo(() => {
    const map = new Map(names)
    if (profile) map.set(profile.id, profile.name)
    return map
  }, [names, profile])

  if (loading && !profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!profile) {
    return (
      <>
        <PageHeader title="Member" />
        <p className="py-16 text-center text-sm text-muted">No member with this link.</p>
      </>
    )
  }

  const lastPlan = sorted.find((m) => m.status !== 'cancelled')?.plan_key
  const payers = (paying?.member_ids ?? [profile.id]).map((id) => ({
    id,
    name: allNames.get(id) ?? 'Member',
  }))

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        title={profile.name || 'Member'}
        actions={
          <Button variant="primary" size="sm" onPress={() => setSelling(true)}>
            <LuPlus className="size-4" />
            New membership
          </Button>
        }
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
        <Link to="/godmode/members" className="flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <LuArrowLeft className="size-4" />
          Members
        </Link>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-start gap-2">
            <div>
              <h2 className="text-xl font-semibold">{profile.name || 'No name'}</h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                <span className="tabular-nums">{profile.phone ? prettyPhone(profile.phone) : 'No phone'}</span>
                {profile.phone_verified_at && (
                  <Chip size="sm" variant="soft" color="success">
                    <LuBadgeCheck className="size-3.5" />
                    Verified
                  </Chip>
                )}
              </div>
            </div>
            <div className="ml-auto flex gap-2">
              {profile.phone && (
                <>
                  <Button size="sm" variant="secondary" onPress={() => window.open(`tel:${profile.phone}`, '_self')}>
                    <LuPhone className="size-4" />
                    Call
                  </Button>
                  <Button size="sm" variant="secondary" onPress={() => window.open(waHref(profile.phone!), '_blank')}>
                    <FaWhatsapp className="size-4" />
                    WhatsApp
                  </Button>
                </>
              )}
              <Button size="sm" variant="secondary" onPress={() => setEditing(true)}>
                <LuPencil className="size-4" />
                Edit
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Fact label="Email" value={profile.email || '–'} />
            <Fact label="Gender" value={profile.gender ? (genderLabel[profile.gender] ?? profile.gender) : '–'} />
            <Fact label="Date of birth" value={profile.dob ? formatDay(profile.dob) : '–'} />
            <div className="col-span-full">
              <p className="eyebrow text-[10px] text-muted">Notes</p>
              <p className="mt-0.5 text-sm whitespace-pre-wrap">{profile.notes || '–'}</p>
            </div>
          </div>
          <p className="text-xs text-muted">Member since {formatDateTime(profile.created_at)}</p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="eyebrow text-xs text-muted">Memberships</h2>
          {dues.length > 0 && (
            <Alert status="warning">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>
                  {formatINR(dueTotal)} pending
                  {dues.length > 1 ? ` across ${dues.length} passes` : ` on ${dues[0].plan_name}`}
                </Alert.Title>
              </Alert.Content>
            </Alert>
          )}
          {sorted.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
              No membership yet.
            </p>
          ) : (
            sorted.map((m) => (
              <MembershipCard
                key={m.membership_id}
                membership={m}
                payments={payments.filter((p) => p.membership_id === m.membership_id)}
                names={allNames}
                memberId={profile.id}
                onRecord={() => setPaying(m)}
                onVoid={setVoiding}
              />
            ))
          )}
        </section>
      </div>

      <EditMember
        member={profile}
        isOpen={editing}
        onClose={() => setEditing(false)}
        onSaved={(updated) => {
          setEditing(false)
          setProfile(updated)
        }}
      />

      <NewMembership
        member={profile}
        isOpen={selling}
        defaultPlanKey={lastPlan}
        onClose={() => setSelling(false)}
        onCreated={() => {
          setSelling(false)
          load()
        }}
      />

      <RecordPayment
        membership={paying}
        payers={payers}
        defaultPayer={profile.id}
        onClose={() => setPaying(null)}
        onSaved={() => {
          setPaying(null)
          load()
        }}
      />

      <VoidPayment
        payment={voiding}
        onClose={() => setVoiding(null)}
        onVoided={() => {
          setVoiding(null)
          load()
        }}
      />
    </div>
  )
}
