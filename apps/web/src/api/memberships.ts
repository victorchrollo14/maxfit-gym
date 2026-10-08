import { createServerFn } from '@tanstack/react-start'
import { addDays, formatDay, todayIST } from '@/lib/dates'
import { EARLIEST_START, findPlan } from '@/plans'
import { adminSupabase } from '@/server/supabase'
import { requireAdmin } from './requireAdmin'

export const METHODS = ['upi', 'cash', 'card'] as const
export type Method = (typeof METHODS)[number]

export type NewPayment = {
  amount: number
  method: Method
  reference?: string
  /** YYYY-MM-DD, today or earlier. */
  paidOn: string
  paidBy: string
  note?: string
}

const DAY = /^\d{4}-\d{2}-\d{2}$/

function money(value: number) {
  return Math.round(value * 100) / 100
}

/** Checks a payment against what's left to pay and returns the row to insert. */
function paymentRow(
  payment: NewPayment,
  { pending, seatIds, adminId }: { pending: number; seatIds: string[]; adminId: string },
) {
  const amount = money(Number(payment.amount))
  if (!(amount > 0)) throw new Error('The amount has to be more than ₹0')
  if (amount > pending) throw new Error(`That's more than the ₹${pending} left to pay`)
  if (!METHODS.includes(payment.method)) throw new Error('Pick UPI, cash or card')

  const reference = payment.reference?.trim() || null
  if (payment.method !== 'cash' && !reference) {
    throw new Error('UPI and card payments need a reference')
  }
  if (!seatIds.includes(payment.paidBy)) throw new Error('Paid by has to be on the membership')

  const today = todayIST()
  if (!DAY.test(payment.paidOn) || payment.paidOn > today) {
    throw new Error("Paid on can't be in the future")
  }

  return {
    paid_by: payment.paidBy,
    amount,
    method: payment.method,
    reference_id: payment.method === 'cash' ? null : reference,
    status: 'paid',
    marked_by: adminId,
    // A backdated payment has no time, so it's pinned to midday IST.
    paid_at:
      payment.paidOn === today
        ? new Date().toISOString()
        : `${payment.paidOn}T12:00:00+05:30`,
    note: payment.note?.trim() || null,
  }
}

function paymentError(error: { code?: string; message: string }) {
  if (error.code === '23505') return new Error('That reference is already recorded on another payment')
  console.error('payment insert failed', error)
  return new Error('Could not save the payment')
}

type Db = ReturnType<typeof adminSupabase>

// One person can't have two memberships covering the same day.
async function checkClashes(db: Db, people: { id: string; name: string }[], startDate: string, endDate: string) {
  const { data: clashes, error } = await db
    .from('membership_users')
    .select('user_id, memberships!inner(plan_name, start_date, end_date, cancelled_at)')
    .in('user_id', people.map((p) => p.id))
    .eq('status', 'active')
    .is('memberships.cancelled_at', null)
    .lte('memberships.start_date', endDate)
    .gte('memberships.end_date', startDate)
  if (error) throw error
  const clash = clashes[0] as unknown as
    | { user_id: string; memberships: { plan_name: string; start_date: string; end_date: string } }
    | undefined
  if (clash) {
    const m = clash.memberships
    const name = people.find((p) => p.id === clash.user_id)?.name || 'This member'
    throw new Error(
      `${name}'s ${m.plan_name} already covers ${formatDay(m.start_date)} – ${formatDay(m.end_date)}`,
    )
  }
}

export type NewMembership = {
  planKey: string
  memberIds: string[]
  startDate: string
  discountAmount: number
  discountReason?: string
  payment?: NewPayment
}

export const createMembership = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator((input: NewMembership) => input)
  .handler(async ({ data, context }) => {
    const db = adminSupabase()

    const plan = findPlan(data.planKey)
    if (!plan?.onSale) throw new Error('That plan is not on sale')

    const memberIds = [...new Set(data.memberIds)]
    if (memberIds.length < 1) throw new Error('Pick a member')
    if (memberIds.length > plan.seats) {
      throw new Error(plan.seats === 1 ? 'Pick one member' : `${plan.name} is for up to ${plan.seats} members`)
    }

    if (!DAY.test(data.startDate) || data.startDate < EARLIEST_START) {
      throw new Error(`The start date can't be before ${formatDay(EARLIEST_START)}`)
    }
    const endDate = addDays(data.startDate, plan.durationDays - 1)

    const discount = money(Number(data.discountAmount) || 0)
    const discountReason = data.discountReason?.trim() || null
    if (discount < 0 || discount > plan.price) throw new Error('The discount has to be between ₹0 and the price')
    if (discount > 0 && !discountReason) throw new Error('A discount needs a reason')

    const { data: people, error: peopleError } = await db
      .from('user_profiles')
      .select('id, name')
      .in('id', memberIds)
    if (peopleError) throw peopleError
    if (people.length !== memberIds.length) throw new Error('Member not found')

    await checkClashes(db, people, data.startDate, endDate)

    const payment = data.payment
      ? paymentRow(data.payment, {
          pending: money(plan.price - discount),
          seatIds: memberIds,
          adminId: context.adminId,
        })
      : null

    const { data: membership, error: membershipError } = await db
      .from('memberships')
      .insert({
        plan_key: plan.key,
        plan_name: plan.name,
        price: plan.price,
        duration_days: plan.durationDays,
        pause_days_allowed: plan.pauseDaysAllowed,
        start_date: data.startDate,
        end_date: endDate,
        discount_amount: discount,
        discount_reason: discount > 0 ? discountReason : null,
        created_by: context.adminId,
      })
      .select('id')
      .single()
    if (membershipError) throw membershipError

    // Not one transaction (D1): undo the membership if a later insert fails.
    const undo = async () => {
      await db.rpc('delete_membership', { _membership_id: membership.id })
    }

    const { error: seatsError } = await db
      .from('membership_users')
      .insert(memberIds.map((user_id) => ({ membership_id: membership.id, user_id })))
    if (seatsError) {
      await undo()
      throw seatsError
    }

    if (payment) {
      const { error } = await db
        .from('payments')
        .insert({ ...payment, membership_id: membership.id })
      if (error) {
        await undo()
        throw paymentError(error)
      }
    }

    return { membershipId: membership.id }
  })

export const addPartner = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator((input: { membershipId: string; memberId: string }) => input)
  .handler(async ({ data }) => {
    const db = adminSupabase()

    const { data: membership, error } = await db
      .from('memberships')
      .select('plan_key, plan_name, start_date, end_date, cancelled_at, membership_users(user_id, status)')
      .eq('id', data.membershipId)
      .single()
    if (error) throw new Error('Membership not found')
    if (membership.cancelled_at) throw new Error('This membership is cancelled')
    if (membership.end_date < todayIST()) throw new Error('This membership has ended')

    const seatIds = membership.membership_users
      .filter((seat) => seat.status === 'active')
      .map((seat) => seat.user_id)
    if (seatIds.includes(data.memberId)) throw new Error('They are already on this membership')
    if (seatIds.length >= (findPlan(membership.plan_key)?.seats ?? 1)) {
      throw new Error(`${membership.plan_name} has no free seat`)
    }

    const { data: person, error: personError } = await db
      .from('user_profiles')
      .select('id, name')
      .eq('id', data.memberId)
      .maybeSingle()
    if (personError) throw personError
    if (!person) throw new Error('Member not found')

    await checkClashes(db, [person], membership.start_date, membership.end_date)

    const { error: seatError } = await db
      .from('membership_users')
      .insert({ membership_id: data.membershipId, user_id: person.id })
    if (seatError) {
      if (seatError.code === '23505') throw new Error(`${person.name || 'This member'} was on this membership before`)
      throw seatError
    }
    return { added: true }
  })

export const recordPayment = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator((input: NewPayment & { membershipId: string }) => input)
  .handler(async ({ data, context }) => {
    const db = adminSupabase()

    const { data: membership, error } = await db
      .from('memberships')
      .select('price, discount_amount, membership_users(user_id, status), payments(amount, status)')
      .eq('id', data.membershipId)
      .single()
    if (error) throw new Error('Membership not found')

    const paid = membership.payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0)
    const pending = money(Number(membership.price) - Number(membership.discount_amount) - paid)
    if (pending <= 0) throw new Error('Nothing is left to pay on this membership')

    const row = paymentRow(data, {
      pending,
      seatIds: membership.membership_users
        .filter((seat) => seat.status === 'active')
        .map((seat) => seat.user_id),
      adminId: context.adminId,
    })

    const { data: saved, error: insertError } = await db
      .from('payments')
      .insert({ ...row, membership_id: data.membershipId })
      .select('id')
      .single()
    if (insertError) throw paymentError(insertError)
    return { paymentId: saved.id }
  })

export const voidPayment = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator((input: { paymentId: string; reason: string }) => input)
  .handler(async ({ data }) => {
    const reason = data.reason.trim()
    if (!reason) throw new Error('Cancelling a payment needs a reason')

    const { data: rows, error } = await adminSupabase()
      .from('payments')
      .update({ status: 'void', void_reason: reason })
      .eq('id', data.paymentId)
      .eq('status', 'paid')
      .select('id')
    if (error) throw error
    if (rows.length === 0) throw new Error('Only a paid payment can be cancelled')
    return { voided: true }
  })

export const deleteMembership = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator((input: { membershipId: string }) => input)
  .handler(async ({ data, context }) => {
    if (context.claims.membership_delete !== true) throw new Error('Not allowed')

    const { data: deleted, error } = await adminSupabase().rpc('delete_membership', {
      _membership_id: data.membershipId,
    })
    if (error) throw error
    if (!deleted) throw new Error('Membership not found')
    return { deleted: true }
  })
