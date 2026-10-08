import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Button, Chip, Spinner, Tabs, Toast, cn } from '@heroui/react'
import type { IconType } from 'react-icons'
import {
  LuArrowDown,
  LuArrowUp,
  LuArrowUpRight,
  LuChartColumn,
  LuTrendingUp,
  LuCircleAlert,
  LuHourglass,
  LuInbox,
  LuReceipt,
  LuRefreshCw,
  LuUserCheck,
  LuUserPlus,
  LuWallet,
} from 'react-icons/lu'
import { getSupabase } from '@/lib/supabase'
import { addDays, dayIST, formatDay, todayIST } from '@/lib/dates'
import { compactINR, formatINR } from '@/lib/format'
import { EARLIEST_START } from '@/plans'
import { BarChart, LineChart, type Point } from './charts'
import { PageHeader } from './PageHeader'
import { prettyPhone } from './leads/shared'
import type { MemberFilters } from './members/filters'
import {
  PAYMENT_FIELDS,
  fetchAll,
  loadMembers,
  loadMembershipSummary,
  memberRows,
  methodLabel,
  planTone,
  statusColor,
  statusLabel,
  type MemberRow,
  type Membership,
  type Payment,
  type Profile,
} from './members/shared'

const RECENT = 6
const RUNNING = ['active', 'paused']

type Leads = { today: number; open: number }

const METHOD_DOT: Record<string, string> = { upi: 'bg-violet-500', cash: 'bg-emerald-500', card: 'bg-sky-500' }

/** Everything here is worked out in the browser from the same rows the members list reads. */
const isTestUser = (name: string) => /^\s*test user\b/i.test(name)

function summarize(rows: MemberRow[], memberships: Membership[], payments: Payment[], today: string) {
  const renewed = (row: MemberRow) => row.passes.some((m) => m.status === 'upcoming')
  const isExpiring = (row: MemberRow) =>
    Boolean(row.current && RUNNING.includes(row.current.status) && row.current.days_left <= 7 && !renewed(row))
  const expiring = rows.filter(isExpiring).sort((a, b) => a.current!.days_left - b.current!.days_left)
  const count = (test: (row: MemberRow) => boolean) => rows.filter(test).length

  const month = today.slice(0, 7)
  const paid = payments.filter((p) => p.status === 'paid' && dayIST(p.paid_at).startsWith(month))
  const paidToday = paid.filter((p) => dayIST(p.paid_at) === today)
  const byMethod = new Map<string, number>()
  for (const p of paidToday) byMethod.set(p.method, (byMethod.get(p.method) ?? 0) + Number(p.amount))

  /* Disjoint slices for the status bar: expiring members are pulled out of active and paused. */
  const segments = [
    { key: 'active', label: 'Active', value: count((r) => r.current?.status === 'active' && !isExpiring(r)), color: 'bg-emerald-500', search: { status: ['active'] } },
    { key: 'expiring', label: 'Expiring this week', value: expiring.length, color: 'bg-amber-500', search: { status: ['expiring_7'] } },
    { key: 'paused', label: 'Paused', value: count((r) => r.current?.status === 'paused' && !isExpiring(r)), color: 'bg-sky-500', search: { status: ['paused'] } },
    { key: 'upcoming', label: 'Upcoming', value: count((r) => r.current?.status === 'upcoming'), color: 'bg-violet-500', search: { status: ['upcoming'] } },
    { key: 'expired', label: 'Expired, not renewed', value: count((r) => r.current?.status === 'expired'), color: 'bg-rose-500', search: { status: ['expired'] } },
    { key: 'none', label: 'No plan', value: count((r) => !r.current), color: 'bg-zinc-400', search: { status: ['none'] } },
  ] satisfies { key: string; label: string; value: number; color: string; search: MemberFilters }[]

  return {
    total: rows.length,
    active: count((r) => r.current?.status === 'active'),
    segments,
    expiring,
    owing: count((r) => r.dueTotal > 0),
    /* Per pass, so a shared Couple Pass is counted once. */
    pending: memberships
      .filter((m) => m.status !== 'cancelled' && m.amount_pending > 0)
      .reduce((sum, m) => sum + Number(m.amount_pending), 0),
    collectedToday: paidToday.reduce((sum, p) => sum + Number(p.amount), 0),
    paymentsToday: paidToday.length,
    byMethod: [...byMethod].sort((a, b) => b[1] - a[1]),
    collectedMonth: paid.reduce((sum, p) => sum + Number(p.amount), 0),
    recentMembers: [...rows]
      .sort((a, b) => b.profile.created_at.localeCompare(a.profile.created_at))
      .slice(0, RECENT),
    recentPasses: [...memberships].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, RECENT),
  }
}

const istHour = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Asia/Kolkata' })

function greeting() {
  const hour = Number(istHour.format(new Date()))
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

function longDate(day: string) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

type Period = 'daily' | 'weekly' | 'monthly'

const PERIODS: { key: Period; label: string; current: string; previous: string; range: string; unit: string }[] = [
  { key: 'daily', label: 'Daily', current: 'Today', previous: 'yesterday', range: 'Last 14 days', unit: 'day' },
  { key: 'weekly', label: 'Weekly', current: 'This week', previous: 'last week', range: 'Last 12 weeks', unit: 'week' },
  { key: 'monthly', label: 'Monthly', current: 'This month', previous: 'last month', range: 'Last 12 months', unit: 'month' },
]

function shortDate(day: string, options: Intl.DateTimeFormatOptions) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-IN', { ...options, timeZone: 'UTC' })
}

/** Weeks start on Monday. */
function weekStart(day: string) {
  return addDays(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7))
}

function monthsBack(day: string, months: number) {
  const date = new Date(`${day.slice(0, 7)}-01T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() - months)
  return date.toISOString().slice(0, 10)
}

function bucketOf(period: Period, day: string) {
  return period === 'daily' ? day : period === 'weekly' ? weekStart(day) : day.slice(0, 7)
}

function buckets(period: Period, today: string): Omit<Point, 'value'>[] {
  if (period === 'daily') {
    return Array.from({ length: 14 }, (_, i) => {
      const day = addDays(today, i - 13)
      return { key: day, label: String(Number(day.slice(8))), title: formatDay(day) }
    })
  }
  if (period === 'weekly') {
    const start = weekStart(today)
    return Array.from({ length: 12 }, (_, i) => {
      const day = addDays(start, (i - 11) * 7)
      return { key: day, label: shortDate(day, { day: 'numeric', month: 'short' }), title: `Week of ${formatDay(day)}` }
    })
  }
  return Array.from({ length: 12 }, (_, i) => {
    const day = monthsBack(today, 11 - i)
    return {
      key: day.slice(0, 7),
      label: shortDate(day, { month: 'short' }),
      title: shortDate(day, { month: 'long', year: 'numeric' }),
    }
  })
}

function sumBy(period: Period, today: string, items: { day: string; value: number }[]): Point[] {
  const sums = new Map<string, number>()
  for (const item of items) {
    const key = bucketOf(period, item.day)
    sums.set(key, (sums.get(key) ?? 0) + item.value)
  }
  return buckets(period, today).map((b) => ({ ...b, value: sums.get(b.key) ?? 0 }))
}

function Change({ now, before, label }: { now: number; before: number; label: string }) {
  if (!before) return null
  const pct = Math.round(((now - before) / before) * 100)
  const up = pct >= 0
  return (
    <span
      title={`vs ${label}`}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums',
        up ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
      )}
    >
      {up ? <LuArrowUp className="size-3" /> : <LuArrowDown className="size-3" />}
      {Math.abs(pct)}%
    </span>
  )
}

function Stat({ label, value, extra }: { label: string; value: ReactNode; extra?: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2">
        <span className="display text-2xl tabular-nums">{value}</span>
        {extra}
      </p>
      <p className="truncate text-xs text-muted">{label}</p>
    </div>
  )
}

function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('rounded-2xl border border-border bg-surface', className)}>{children}</section>
}

function CardTitle({ icon: Icon, title, action }: { icon: IconType; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
      <Icon className="size-4 text-muted" />
      <h3 className="font-medium">{title}</h3>
      {action && <div className="ms-auto">{action}</div>}
    </div>
  )
}

function Headline({
  icon: Icon,
  label,
  value,
  hint,
  tone,
  search,
}: {
  icon: IconType
  label: string
  value: ReactNode
  hint: ReactNode
  tone: string
  search?: MemberFilters
}) {
  const body = (
    <>
      <div className="flex items-center gap-2.5">
        <span className={cn('grid size-9 place-items-center rounded-xl', tone)}>
          <Icon className="size-4.5" />
        </span>
        <p className="eyebrow text-xs text-muted">{label}</p>
        {search && <LuArrowUpRight className="ms-auto size-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />}
      </div>
      <p className="display mt-3 text-4xl tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </>
  )
  const className = 'group rounded-xl p-4 transition-colors'
  return search ? (
    <Link to="/godmode/members" search={search} className={cn(className, 'hover:bg-surface-secondary')}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
      {initials(name)}
    </span>
  )
}

function ListRow({ memberId, children }: { memberId?: string; children: ReactNode }) {
  const className = 'flex items-center gap-3 px-5 py-2.5 text-sm'
  return (
    <li>
      {memberId ? (
        <Link
          to="/godmode/members/$memberId"
          params={{ memberId }}
          className={cn(className, 'transition-colors hover:bg-surface-secondary')}
        >
          {children}
        </Link>
      ) : (
        <div className={className}>{children}</div>
      )}
    </li>
  )
}

function ListBody({ empty, children }: { empty: string; children: ReactNode[] }) {
  return children.length ? (
    <ul className="divide-y divide-border py-1">{children}</ul>
  ) : (
    <p className="px-5 py-10 text-center text-sm text-muted">{empty}</p>
  )
}

function StatusBar({ segments, total }: { segments: ReturnType<typeof summarize>['segments']; total: number }) {
  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex h-3 overflow-hidden rounded-full bg-surface-secondary">
        {segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.key}
              title={`${s.label}: ${s.value}`}
              className={cn('h-full border-e-2 border-surface last:border-e-0', s.color)}
              style={{ width: `${(s.value / total) * 100}%` }}
            />
          ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {segments.map((s) => (
          <Link
            key={s.key}
            to="/godmode/members"
            search={s.search}
            className="group rounded-xl border border-border p-3 transition-colors hover:border-accent hover:bg-surface-secondary"
          >
            <span className="flex items-center gap-2">
              <span className={cn('size-2.5 shrink-0 rounded-full', s.color)} />
              <span className="min-w-0 flex-1 truncate text-xs text-muted">{s.label}</span>
              <LuArrowUpRight className="size-3.5 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
            <span className="display mt-1.5 block text-2xl tabular-nums">{s.value}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function Dashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [leads, setLeads] = useState<Leads | null>(null)
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [period, setPeriod] = useState<Period>('daily')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = getSupabase()
    const today = todayIST()
    try {
      const [members, summary, paid, leadsToday, openLeads] = await Promise.all([
        loadMembers(),
        loadMembershipSummary(),
        fetchAll<Payment>((from, to) =>
          supabase
            .from('payments')
            .select(PAYMENT_FIELDS)
            .eq('status', 'paid')
            .gte('paid_at', `${monthsBack(today, 11)}T00:00:00+05:30`)
            .order('paid_at')
            .order('id')
            .range(from, to),
        ),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .not('name', 'ilike', 'test user%')
          .gte('created_at', `${today}T00:00:00+05:30`),
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .not('name', 'ilike', 'test user%')
          .not('status', 'in', '(converted,lost)'),
      ])
      const testIds = new Set(members.filter((p) => isTestUser(p.name)).map((p) => p.id))
      const realSummary = summary.filter((m) => !(m.member_ids ?? []).some((id) => testIds.has(id)))
      const realIds = new Set(realSummary.map((m) => m.membership_id))
      setProfiles(members.filter((p) => !testIds.has(p.id)))
      setMemberships(realSummary)
      setPayments(paid.filter((p) => !testIds.has(p.paid_by) && (!p.membership_id || realIds.has(p.membership_id))))
      // The lead counts are extras: if they fail, their tiles show a dash and the rest still loads.
      if (leadsToday.error || openLeads.error) console.error('lead counts failed', leadsToday.error ?? openLeads.error)
      setLeads(
        leadsToday.error || openLeads.error ? null : { today: leadsToday.count ?? 0, open: openLeads.count ?? 0 },
      )
      setLoaded(true)
    } catch (error) {
      console.error('dashboard load failed', error)
      Toast.toast.danger('Could not load the dashboard.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const today = todayIST()
  const rows = useMemo(() => memberRows(profiles, memberships), [profiles, memberships])
  const names = useMemo(() => new Map(profiles.map((p) => [p.id, p.name])), [profiles])
  const s = useMemo(() => summarize(rows, memberships, payments, today), [rows, memberships, payments, today])

  const collections = useMemo(
    () =>
      sumBy(
        period,
        today,
        payments.map((p) => ({ day: dayIST(p.paid_at), value: Number(p.amount) })),
      ),
    [period, today, payments],
  )
  const growth = useMemo(() => {
    const joined = sumBy('monthly', today, profiles.map((p) => ({ day: dayIST(p.created_at), value: 1 }))).slice(-6)
    const sold = sumBy(
      'monthly',
      today,
      memberships.filter((m) => m.status !== 'cancelled').map((m) => ({ day: dayIST(m.created_at), value: 1 })),
    ).slice(-6)
    return { joined, sold }
  }, [today, profiles, memberships])
  const meta = PERIODS.find((p) => p.key === period)!
  const latest = collections[collections.length - 1]
  const previous = collections[collections.length - 2]
  const rangeTotal = collections.reduce((sum, p) => sum + p.value, 0)
  // Periods before the CRM existed would only drag the average down.
  const counted = collections.filter((p) => p.key >= bucketOf(period, EARLIEST_START)).length

  return (
    <>
      <PageHeader
        title="Dashboard"
        actions={
          <Button isIconOnly variant="ghost" aria-label="Refresh" isPending={loading} onPress={load}>
            <LuRefreshCw className="size-4" />
          </Button>
        }
      />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
        {!loaded ? (
          <div className="flex justify-center py-16">{loading ? <Spinner /> : null}</div>
        ) : (
          <>
            <Card className="relative overflow-hidden">
              <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-accent/10 blur-3xl" />
              <div className="relative px-5 pt-5">
                <p className="eyebrow text-xs text-muted">{longDate(today)}</p>
                <h2 className="display mt-1 text-3xl">{greeting()}</h2>
              </div>
              <div className="relative grid gap-1 p-2 sm:grid-cols-3">
                <Headline
                  icon={LuUserCheck}
                  label="Active members"
                  value={s.active}
                  hint={`of ${s.total} members`}
                  tone="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  search={{ status: ['active'] }}
                />
                <Headline
                  icon={LuWallet}
                  label="Collected this month"
                  value={formatINR(s.collectedMonth)}
                  hint="By the day each payment was made"
                  tone="bg-accent/15 text-accent"
                />
                <Headline
                  icon={LuCircleAlert}
                  label="Pending dues"
                  value={<span className={s.pending ? 'text-danger' : undefined}>{formatINR(s.pending)}</span>}
                  hint={`${s.owing} ${s.owing === 1 ? 'member owes' : 'members owe'} money`}
                  tone="bg-rose-500/15 text-rose-600 dark:text-rose-400"
                  search={{ pay: ['dues'] }}
                />
              </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-5">
              <Card className="lg:col-span-3">
                <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-2.5">
                  <LuChartColumn className="size-4 text-muted" />
                  <h3 className="font-medium">Collections</h3>
                  <Tabs
                    className="ms-auto"
                    selectedKey={period}
                    onSelectionChange={(key) => setPeriod(key as Period)}
                  >
                    <Tabs.ListContainer>
                      <Tabs.List aria-label="Collections period">
                        {PERIODS.map((p) => (
                          <Tabs.Tab key={p.key} id={p.key}>
                            {p.label}
                            <Tabs.Indicator />
                          </Tabs.Tab>
                        ))}
                      </Tabs.List>
                    </Tabs.ListContainer>
                  </Tabs>
                </div>
                <div className="grid grid-cols-3 gap-4 px-5 pt-4 pb-5">
                  <Stat
                    label={meta.current}
                    value={formatINR(latest.value)}
                    extra={<Change now={latest.value} before={previous.value} label={meta.previous} />}
                  />
                  <Stat label={meta.range} value={formatINR(rangeTotal)} />
                  <Stat label={`Average per ${meta.unit}`} value={formatINR(Math.round(rangeTotal / Math.max(counted, 1)))} />
                </div>
                <div className="px-5 pb-5">
                  <BarChart points={collections} format={formatINR} axis={compactINR} highlight={latest.key} />
                </div>
              </Card>

              <Card className="lg:col-span-2">
                <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
                  <LuTrendingUp className="size-4 text-muted" />
                  <h3 className="font-medium">Growth</h3>
                  <div className="ms-auto flex gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-accent" /> New members
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-violet-500" /> Passes sold
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 px-5 pt-4 pb-5">
                  <Stat
                    label="New members this month"
                    value={growth.joined[5].value}
                    extra={<Change now={growth.joined[5].value} before={growth.joined[4].value} label="last month" />}
                  />
                  <Stat
                    label="Passes sold this month"
                    value={growth.sold[5].value}
                    extra={<Change now={growth.sold[5].value} before={growth.sold[4].value} label="last month" />}
                  />
                </div>
                <div className="px-5 pb-5">
                  <LineChart
                    labels={growth.joined.map((p) => p.label)}
                    titles={growth.joined.map((p) => p.title)}
                    series={[
                      { name: 'New members', stroke: 'stroke-accent', fill: 'fill-accent', values: growth.joined.map((p) => p.value) },
                      { name: 'Passes sold', stroke: 'stroke-violet-500', fill: 'fill-violet-500', values: growth.sold.map((p) => p.value) },
                    ]}
                  />
                </div>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardTitle
                  icon={LuUserCheck}
                  title="Membership status"
                  action={<span className="text-xs text-muted tabular-nums">{s.total} members</span>}
                />
                {s.total ? (
                  <StatusBar segments={s.segments} total={s.total} />
                ) : (
                  <p className="px-5 py-10 text-center text-sm text-muted">No members yet.</p>
                )}
              </Card>

              <Card>
                <CardTitle icon={LuReceipt} title="Today" />
                <div className="flex flex-col gap-4 p-5">
                  <div>
                    <p className="eyebrow text-[10px] text-muted">Collected</p>
                    <p className="display mt-1 text-3xl tabular-nums">{formatINR(s.collectedToday)}</p>
                    <p className="text-xs text-muted">
                      {s.paymentsToday} {s.paymentsToday === 1 ? 'payment' : 'payments'}
                    </p>
                  </div>
                  {s.byMethod.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {s.byMethod.map(([method, amount]) => (
                        <span
                          key={method}
                          className="flex items-center gap-1.5 rounded-full bg-surface-secondary px-2.5 py-1 text-xs tabular-nums"
                        >
                          <span className={cn('size-2 rounded-full', METHOD_DOT[method] ?? 'bg-zinc-400')} />
                          {methodLabel[method] ?? method} {formatINR(amount)}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 border-t border-border pt-4">
                    <Link to="/godmode/leads" className="rounded-lg p-2 transition-colors hover:bg-surface-secondary">
                      <p className="flex items-center gap-1.5 text-xs text-muted">
                        <LuInbox className="size-3.5" /> New leads
                      </p>
                      <p className="mt-1 text-xl font-semibold tabular-nums">{leads?.today ?? '–'}</p>
                    </Link>
                    <Link to="/godmode/leads" className="rounded-lg p-2 transition-colors hover:bg-surface-secondary">
                      <p className="flex items-center gap-1.5 text-xs text-muted">
                        <LuInbox className="size-3.5" /> Open leads
                      </p>
                      <p className="mt-1 text-xl font-semibold tabular-nums">{leads?.open ?? '–'}</p>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>


            <div className="grid gap-4 lg:grid-cols-3">
              <Card>
                <CardTitle
                  icon={LuHourglass}
                  title="Expiring this week"
                  action={
                    s.expiring.length > 0 && (
                      <Chip size="sm" variant="soft" color="warning">
                        {s.expiring.length}
                      </Chip>
                    )
                  }
                />
                <ListBody empty="Nobody's pass ends this week.">
                  {s.expiring.map(({ profile, current }) => (
                    <ListRow key={profile.id} memberId={profile.id}>
                      <Avatar name={profile.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{profile.name}</p>
                        <p className="truncate text-xs text-muted">{current!.plan_name}</p>
                      </div>
                      <Chip size="sm" variant="soft" color="warning">
                        {current!.days_left === 1 ? 'Ends today' : `${current!.days_left} days`}
                      </Chip>
                    </ListRow>
                  ))}
                </ListBody>
              </Card>

              <Card>
                <CardTitle icon={LuUserPlus} title="Recently added members" />
                <ListBody empty="No members yet.">
                  {s.recentMembers.map(({ profile, current }) => (
                    <ListRow key={profile.id} memberId={profile.id}>
                      <Avatar name={profile.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{profile.name}</p>
                        <p className="truncate text-xs text-muted tabular-nums">
                          {profile.phone ? prettyPhone(profile.phone) : '–'} · {formatDay(dayIST(profile.created_at))}
                        </p>
                      </div>
                      {current ? (
                        <Chip size="sm" variant="soft" color={statusColor[current.status]}>
                          {statusLabel[current.status]}
                        </Chip>
                      ) : (
                        <span className="text-xs text-muted">No plan</span>
                      )}
                    </ListRow>
                  ))}
                </ListBody>
              </Card>

              <Card>
                <CardTitle icon={LuReceipt} title="Recent memberships" />
                <ListBody empty="No memberships sold yet.">
                  {s.recentPasses.map((m) => (
                    <ListRow key={m.membership_id} memberId={m.member_ids?.[0]}>
                      <span className={cn('h-8 w-1 shrink-0 rounded-full', planTone(m.plan_key).bar)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {(m.member_ids ?? []).map((id) => names.get(id) ?? 'Member').join(' & ')}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {m.plan_name} · {formatDay(m.start_date)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-xs whitespace-nowrap tabular-nums',
                          m.status === 'cancelled'
                            ? 'text-muted'
                            : m.amount_pending > 0
                              ? 'font-medium text-danger'
                              : 'font-medium text-success',
                        )}
                      >
                        {m.status === 'cancelled'
                          ? 'Cancelled'
                          : m.amount_pending > 0
                            ? `${formatINR(Number(m.amount_pending))} due`
                            : 'Paid'}
                      </span>
                    </ListRow>
                  ))}
                </ListBody>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  )
}
