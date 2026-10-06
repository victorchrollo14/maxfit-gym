import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Button,
  Chip,
  Input,
  ListBox,
  Pagination,
  SearchField,
  Select,
  Spinner,
  Table,
  Toast,
} from '@heroui/react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { LuPlus, LuRefreshCw } from 'react-icons/lu'
import { daysBetween, dayIST, formatDay, todayIST } from '@/lib/dates'
import { formatINR } from '@/lib/format'
import { PLANS } from '@/plans'
import { GENDERS } from '@/api/members'
import { PageHeader } from '@/godmode/PageHeader'
import { DateFilter, ListFilter } from '@/godmode/FilterMenu'
import { prettyPhone } from '@/godmode/leads/shared'
import { AddMember } from './AddMember'
import {
  PAGE_SIZES,
  type MemberFilters,
  type PayKey,
  type SortKey,
  type StatusKey,
} from './filters'
import {
  genderLabel,
  loadMembers,
  loadMembershipSummary,
  matchesSearch,
  memberRows,
  statusColor,
  statusLabel,
  type MemberRow,
  type Membership,
  type MembershipStatus,
  type Profile,
} from './shared'

type Row = MemberRow & { joined: string }

const RUNNING: MembershipStatus[] = ['active', 'paused']

/** Running, ending within `days` days (today counted as the first) and not yet renewed. */
function endsWithin(row: Row, days: number) {
  return Boolean(
    row.current &&
      RUNNING.includes(row.current.status) &&
      row.current.days_left <= days &&
      !row.passes.some((m) => m.status === 'upcoming'),
  )
}

const STATUSES: { key: StatusKey; label: string; test: (row: Row) => boolean }[] = [
  { key: 'active', label: 'Active', test: (row) => row.current?.status === 'active' },
  { key: 'paused', label: 'Paused', test: (row) => row.current?.status === 'paused' },
  { key: 'upcoming', label: 'Upcoming', test: (row) => row.current?.status === 'upcoming' },
  { key: 'expiring_today', label: 'Expiring today', test: (row) => endsWithin(row, 1) },
  { key: 'expiring_3', label: 'Expiring in 3 days', test: (row) => endsWithin(row, 3) },
  { key: 'expiring_7', label: 'Expiring in 7 days', test: (row) => endsWithin(row, 7) },
  { key: 'expired', label: 'Expired', test: (row) => row.current?.status === 'expired' },
  { key: 'none', label: 'No plan', test: (row) => !row.current },
]

/* Partial and no payment go by the current pass; full payment and dues look at every pass. */
const PAYMENTS: { key: PayKey; label: string; test: (row: Row) => boolean }[] = [
  { key: 'complete', label: 'Full payment', test: (row) => Boolean(row.current) && row.dueTotal <= 0 },
  {
    key: 'partial',
    label: 'Partial payment',
    test: (row) => Boolean(row.current && row.current.amount_paid > 0 && row.current.amount_pending > 0),
  },
  {
    key: 'none',
    label: 'No payment',
    test: (row) => Boolean(row.current && row.current.amount_pending > 0 && Number(row.current.amount_paid) === 0),
  },
  { key: 'dues', label: 'Has dues', test: (row) => row.dueTotal > 0 },
]

const statusRank: Record<MembershipStatus, number> = {
  active: 0,
  paused: 1,
  upcoming: 2,
  expired: 3,
  cancelled: 4,
}

const sortValue: Record<SortKey, (row: Row) => string | number | null> = {
  name: (row) => row.profile.name.toLowerCase(),
  plan: (row) => row.current?.plan_name ?? null,
  start: (row) => row.current?.start_date ?? null,
  end: (row) => row.current?.end_date ?? null,
  left: (row) => (row.current && RUNNING.includes(row.current.status) ? row.current.days_left : null),
  status: (row) => (row.current ? statusRank[row.current.status] : null),
  total: (row) => (row.current ? Number(row.current.amount_due) : null),
  paid: (row) => (row.current ? Number(row.current.amount_paid) : null),
  due: (row) => (row.dueTotal > 0 ? row.dueTotal : null),
  joined: (row) => row.profile.created_at,
}

function inRange(day: string | undefined, from?: string, to?: string) {
  if (!from || !to) return true
  return Boolean(day && day >= from && day <= to)
}

/** First, last, and the pages around the current one, with gaps between. */
function pageList(page: number, count: number) {
  const pages = new Set([1, count, page - 1, page, page + 1])
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (page >= count - 2) [count - 3, count - 2, count - 1].forEach((p) => pages.add(p))
  const sorted = [...pages].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? (['gap', p] as const) : [p]))
}

export function Members() {
  const navigate = useNavigate()
  const filters = useSearch({ from: '/godmode/_shell/members/' })
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState(filters.q ?? '')
  const [adding, setAdding] = useState(false)

  /* Every change but paging goes back to page 1. Defaults are dropped to keep the URL short. */
  const setFilters = useCallback(
    (patch: MemberFilters) =>
      navigate({
        to: '/godmode/members',
        replace: true,
        search: (prev: MemberFilters) => {
          const next: MemberFilters = { ...prev, page: undefined, ...patch }
          if (next.sort === 'name') next.sort = undefined
          if (next.size === PAGE_SIZES[0]) next.size = undefined
          if (next.page === 1) next.page = undefined
          if (!next.desc) next.desc = undefined
          return Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined && v !== ''))
        },
      }),
    [navigate],
  )

  useEffect(() => {
    if (query === (filters.q ?? '')) return
    const timer = setTimeout(() => setFilters({ q: query.trim() || undefined }), 250)
    return () => clearTimeout(timer)
  }, [query, filters.q, setFilters])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [members, summary] = await Promise.all([loadMembers(), loadMembershipSummary()])
      setProfiles(members)
      setMemberships(summary)
    } catch (error) {
      console.error('members load failed', error)
      Toast.toast.danger('Could not load members.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const rows = useMemo(
    () => memberRows(profiles, memberships).map((row): Row => ({ ...row, joined: dayIST(row.profile.created_at) })),
    [profiles, memberships],
  )

  const planOptions = useMemo(() => {
    const names = new Map(PLANS.map((plan) => [plan.key, plan.name]))
    for (const m of memberships) if (!names.has(m.plan_key)) names.set(m.plan_key, m.plan_name)
    return [...names]
  }, [memberships])

  /* Status and payment each count against every other filter, so their options show what picking them would leave. */
  const checks = useMemo(() => {
    const pays = PAYMENTS.filter((p) => filters.pay?.includes(p.key))
    const statuses = STATUSES.filter((s) => filters.status?.includes(s.key))
    return {
      rest: (row: Row) =>
        matchesSearch(row.profile, filters.q ?? '') &&
        (!filters.plan || filters.plan.includes(row.current?.plan_key ?? '')) &&
        (!filters.gender || filters.gender.includes(row.profile.gender ?? '')) &&
        inRange(row.current?.start_date, filters.startFrom, filters.startTo) &&
        inRange(row.current?.end_date, filters.endFrom, filters.endTo) &&
        inRange(row.joined, filters.joinedFrom, filters.joinedTo),
      pay: (row: Row) => !pays.length || pays.some((p) => p.test(row)),
      status: (row: Row) => !statuses.length || statuses.some((s) => s.test(row)),
    }
  }, [filters])

  const forStatus = useMemo(() => rows.filter((row) => checks.rest(row) && checks.pay(row)), [rows, checks])
  const forPay = useMemo(() => rows.filter((row) => checks.rest(row) && checks.status(row)), [rows, checks])

  const sort = filters.sort ?? 'name'
  const visible = useMemo(() => {
    const value = sortValue[sort]
    const flip = filters.desc ? -1 : 1
    return forStatus.filter(checks.status).sort((a, b) => {
      const x = value(a)
      const y = value(b)
      if (x === y) return a.profile.name.localeCompare(b.profile.name)
      if (x === null) return 1
      if (y === null) return -1
      return (x < y ? -1 : 1) * flip
    })
  }, [forStatus, checks, filters.desc, sort])

  const size = filters.size ?? PAGE_SIZES[0]
  const pageCount = Math.max(1, Math.ceil(visible.length / size))
  const page = Math.min(filters.page ?? 1, pageCount)
  const pageRows = visible.slice((page - 1) * size, page * size)

  const anyFilter = Boolean(
    filters.q ||
      filters.status ||
      filters.plan ||
      filters.gender ||
      filters.pay ||
      filters.startFrom ||
      filters.endFrom ||
      filters.joinedFrom,
  )
  const today = todayIST()

  const clearAll = () => {
    setQuery('')
    setFilters({
      q: undefined,
      status: undefined,
      plan: undefined,
      gender: undefined,
      pay: undefined,
      startFrom: undefined,
      startTo: undefined,
      endFrom: undefined,
      endTo: undefined,
      joinedFrom: undefined,
      joinedTo: undefined,
    })
  }

  const column = (id: SortKey, label: string, props: { isRowHeader?: boolean; className?: string } = {}) => (
    <Table.Column id={id} allowsSorting {...props}>
      {({ sortDirection }) => (
        <Table.SortableColumnHeader sortDirection={sortDirection}>{label}</Table.SortableColumnHeader>
      )}
    </Table.Column>
  )

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        title="Members"
        actions={
          <>
            <Button isIconOnly variant="ghost" aria-label="Refresh" isPending={loading} onPress={load}>
              <LuRefreshCw className="size-4" />
            </Button>
            <Button variant="primary" size="sm" onPress={() => setAdding(true)}>
              <LuPlus className="size-4" />
              Add member
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <SearchField
            aria-label="Search members"
            value={query}
            onChange={setQuery}
            className="me-1 w-full sm:w-64"
          >
            <Input placeholder="Name or phone digits" />
          </SearchField>
          <ListFilter
            label="Status"
            options={STATUSES.map((s) => [s.key, s.label, forStatus.filter(s.test).length] as const)}
            value={filters.status}
            onChange={(status) => setFilters({ status: status as StatusKey[] | undefined })}
          />
          <ListFilter label="Plan" options={planOptions} value={filters.plan} onChange={(plan) => setFilters({ plan })} />
          <ListFilter
            label="Payment"
            options={PAYMENTS.map((p) => [p.key, p.label, forPay.filter(p.test).length] as const)}
            value={filters.pay}
            onChange={(pay) => setFilters({ pay: pay as PayKey[] | undefined })}
          />
          <ListFilter
            label="Gender"
            options={GENDERS.map((key) => [key, genderLabel[key]] as const)}
            value={filters.gender}
            onChange={(gender) => setFilters({ gender })}
          />
          <DateFilter
            label="Start date"
            presets={['today', 'last7', 'last30', 'thisMonth', 'lastMonth', 'next7', 'next30']}
            value={{ from: filters.startFrom ?? '', to: filters.startTo ?? '' }}
            onChange={({ from, to }) => setFilters({ startFrom: from, startTo: to })}
          />
          <DateFilter
            label="End date"
            presets={['next7', 'next30', 'thisMonth', 'nextMonth', 'last7', 'last30']}
            value={{ from: filters.endFrom ?? '', to: filters.endTo ?? '' }}
            onChange={({ from, to }) => setFilters({ endFrom: from, endTo: to })}
          />
          <DateFilter
            label="Joined"
            presets={['today', 'last7', 'last30', 'thisMonth', 'lastMonth']}
            value={{ from: filters.joinedFrom ?? '', to: filters.joinedTo ?? '' }}
            onChange={({ from, to }) => setFilters({ joinedFrom: from, joinedTo: to })}
          />
          {anyFilter && (
            <Button size="sm" variant="ghost" className="rounded-full text-danger" onPress={clearAll}>
              Clear all
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 pb-6 sm:px-6">
        {loading && profiles.length === 0 ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            {profiles.length === 0 ? 'No members yet.' : 'Nobody matches.'}
          </p>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content
                aria-label="Members"
                className="min-w-[1120px]"
                sortDescriptor={{ column: sort, direction: filters.desc ? 'descending' : 'ascending' }}
                onSortChange={(next) =>
                  setFilters({ sort: next.column as SortKey, desc: next.direction === 'descending' })
                }
                onRowAction={(key) =>
                  navigate({ to: '/godmode/members/$memberId', params: { memberId: String(key) } })
                }
              >
                <Table.Header>
                  {column('name', 'Member', { isRowHeader: true })}
                  {column('plan', 'Plan')}
                  {column('start', 'Start')}
                  {column('end', 'End')}
                  {column('left', 'Left')}
                  {column('status', 'Status')}
                  {column('total', 'Total', { className: 'text-end' })}
                  {column('paid', 'Paid', { className: 'text-end' })}
                  {column('due', 'Due')}
                  {column('joined', 'Joined')}
                </Table.Header>
                <Table.Body items={pageRows}>
                  {({ profile, current, dues, joined }) => (
                    <Table.Row id={profile.id} className="cursor-pointer">
                      <Table.Cell>
                        <p className="font-medium">{profile.name || 'No name'}</p>
                        <p className="text-xs text-muted tabular-nums">
                          {profile.phone ? prettyPhone(profile.phone) : '–'}
                        </p>
                      </Table.Cell>
                      <Table.Cell>
                        {current ? (
                          <>
                            <p>{current.plan_name}</p>
                            {current.discount_amount > 0 && (
                              <p className="text-xs text-muted">
                                {formatINR(Number(current.discount_amount))} off
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-muted">No plan</span>
                        )}
                      </Table.Cell>
                      <Table.Cell className="tabular-nums">{current ? formatDay(current.start_date) : <Dash />}</Table.Cell>
                      <Table.Cell className="tabular-nums">{current ? formatDay(current.end_date) : <Dash />}</Table.Cell>
                      <Table.Cell className="tabular-nums">
                        {current ? <Left m={current} today={today} /> : <Dash />}
                      </Table.Cell>
                      <Table.Cell>
                        {current ? (
                          <Chip
                            size="sm"
                            variant="soft"
                            color={current.expiring_soon ? 'warning' : statusColor[current.status]}
                          >
                            {current.expiring_soon ? 'Expiring' : statusLabel[current.status]}
                          </Chip>
                        ) : (
                          <Dash />
                        )}
                      </Table.Cell>
                      <Table.Cell className="text-end tabular-nums">
                        {current ? formatINR(Number(current.amount_due)) : <Dash />}
                      </Table.Cell>
                      <Table.Cell className="text-end tabular-nums">
                        {current ? (
                          <span className={current.amount_paid > 0 ? 'font-medium text-success' : 'text-muted'}>
                            {formatINR(Number(current.amount_paid))}
                          </span>
                        ) : (
                          <Dash />
                        )}
                      </Table.Cell>
                      <Table.Cell className="tabular-nums">
                        {dues.length ? <Dues dues={dues} current={current} memberId={profile.id} /> : <Dash />}
                      </Table.Cell>
                      <Table.Cell className="tabular-nums text-muted">{formatDay(joined)}</Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
            <Table.Footer className="justify-end">
              <Pagination size="sm" className="w-auto items-end justify-end sm:items-center">
                <Pagination.Summary className="self-end sm:self-center">
                  <span className="tabular-nums">
                    {(page - 1) * size + 1}–{Math.min(page * size, visible.length)} of {visible.length}
                  </span>
                  <Select
                    aria-label="Rows per page"
                    value={String(size)}
                    onChange={(value) => setFilters({ size: Number(value) })}
                    className="ms-2 w-20"
                  >
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {PAGE_SIZES.map((n) => (
                          <ListBox.Item key={n} id={String(n)} textValue={String(n)}>
                            {n}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                  per page
                </Pagination.Summary>
                {pageCount > 1 && (
                  <Pagination.Content className="self-end sm:self-center">
                    <Pagination.Item>
                      <Pagination.Previous
                        aria-label="Previous page"
                        isDisabled={page === 1}
                        onPress={() => setFilters({ page: page - 1 })}
                      >
                        <Pagination.PreviousIcon />
                      </Pagination.Previous>
                    </Pagination.Item>
                    {pageList(page, pageCount).map((p, i) =>
                      p === 'gap' ? (
                        <Pagination.Item key={`gap-${i}`}>
                          <Pagination.Ellipsis />
                        </Pagination.Item>
                      ) : (
                        <Pagination.Item key={p}>
                          <Pagination.Link isActive={p === page} onPress={() => setFilters({ page: p })}>
                            {p}
                          </Pagination.Link>
                        </Pagination.Item>
                      ),
                    )}
                    <Pagination.Item>
                      <Pagination.Next
                        aria-label="Next page"
                        isDisabled={page === pageCount}
                        onPress={() => setFilters({ page: page + 1 })}
                      >
                        <Pagination.NextIcon />
                      </Pagination.Next>
                    </Pagination.Item>
                  </Pagination.Content>
                )}
              </Pagination>
            </Table.Footer>
          </Table>
        )}
      </div>

      <AddMember
        isOpen={adding}
        onClose={() => setAdding(false)}
        onCreated={(memberId) => {
          setAdding(false)
          navigate({ to: '/godmode/members/$memberId', params: { memberId }, search: { sell: true } })
        }}
      />
    </div>
  )
}

const SHOWN_DUES = 2

function Dues({ dues, current, memberId }: { dues: Membership[]; current: Membership | null; memberId: string }) {
  const rest = dues.slice(SHOWN_DUES)
  return (
    <div className="flex flex-col gap-0.5">
      {dues.slice(0, SHOWN_DUES).map((m) => (
        <p key={m.membership_id} className="whitespace-nowrap">
          <span className="font-medium text-danger">{formatINR(Number(m.amount_pending))}</span>
          <span className="text-xs text-muted">
            {' '}
            · {m.plan_name},{' '}
            {m.membership_id === current?.membership_id
              ? 'current'
              : m.status === 'upcoming'
                ? `from ${formatDay(m.start_date)}`
                : formatDay(m.start_date)}
          </span>
        </p>
      ))}
      {rest.length > 0 && (
        <Link
          to="/godmode/members/$memberId"
          params={{ memberId }}
          className="text-xs whitespace-nowrap text-accent hover:underline"
        >
          View {rest.length} more · {formatINR(rest.reduce((sum, m) => sum + Number(m.amount_pending), 0))}
        </Link>
      )}
    </div>
  )
}

function Dash() {
  return <span className="text-muted">–</span>
}

function Left({ m, today }: { m: Membership; today: string }) {
  let main: ReactNode = <Dash />
  let hint: ReactNode = null
  if (RUNNING.includes(m.status)) {
    main = `${m.days_left} ${m.days_left === 1 ? 'day' : 'days'}`
    if (m.pause_days_allowed > 0) hint = `${m.pause_days_left} pause left`
  } else if (m.status === 'upcoming') {
    const days = daysBetween(today, m.start_date)
    main = <span className="text-muted">Starts in {days} {days === 1 ? 'day' : 'days'}</span>
  } else if (m.status === 'expired') {
    const days = daysBetween(m.end_date, today)
    main = <span className="text-muted">Ended {days} {days === 1 ? 'day' : 'days'} ago</span>
  }
  return (
    <>
      <p>{main}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </>
  )
}
