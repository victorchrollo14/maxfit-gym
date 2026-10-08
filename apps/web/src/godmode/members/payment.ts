import { todayIST } from '@/lib/dates'
import { formatINR } from '@/lib/format'
import type { Method, NewPayment } from '@/api/memberships'

export type PaymentDraft = {
  amount: string
  method: Method
  reference: string
  paidOn: string
  paidBy: string
  note: string
}

export function newPaymentDraft(amount: number, paidBy: string): PaymentDraft {
  return {
    amount: String(amount),
    method: 'upi',
    reference: '',
    paidOn: todayIST(),
    paidBy,
    note: '',
  }
}

export function toPayment(draft: PaymentDraft): NewPayment {
  return {
    amount: Number(draft.amount),
    method: draft.method,
    reference: draft.method === 'cash' ? undefined : draft.reference,
    paidOn: draft.paidOn,
    paidBy: draft.paidBy,
    note: draft.note,
  }
}

/** Why the draft can't be saved yet, or null when it can. */
export function paymentProblem(draft: PaymentDraft, max: number) {
  const amount = Number(draft.amount)
  if (!(amount > 0)) return 'Enter an amount'
  if (amount > max) return `At most ${formatINR(max)}`
  if (draft.method !== 'cash' && !draft.reference.trim()) return 'Add the reference'
  if (!draft.paidOn || draft.paidOn > todayIST()) return "Paid on can't be in the future"
  if (!draft.paidBy) return 'Pick who paid'
  return null
}
