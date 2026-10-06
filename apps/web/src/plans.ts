/* What the CRM sells. Terms are copied onto each membership at sale, so changing
   a price here never touches memberships already sold. The landing page keeps its
   own list in content.ts. `key` is stored on memberships: never rename or reuse one. */

export type CrmPlan = {
  key: string
  name: string
  price: number
  durationDays: number
  pauseDaysAllowed: number
  seats: number
  onSale: boolean
}

export const PLANS: CrmPlan[] = [
  { key: 'monthly', name: 'Monthly Pass', price: 1999, durationDays: 30, pauseDaysAllowed: 0, seats: 1, onSale: true },
  { key: 'quarterly', name: '3 Month Pass', price: 3999, durationDays: 90, pauseDaysAllowed: 0, seats: 1, onSale: true },
  { key: 'half_yearly', name: '6 Month Pass', price: 5999, durationDays: 180, pauseDaysAllowed: 7, seats: 1, onSale: true },
  { key: 'annual', name: 'Annual Pass', price: 9999, durationDays: 365, pauseDaysAllowed: 15, seats: 1, onSale: true },
  { key: 'couple', name: 'Couple Pass', price: 14999, durationDays: 365, pauseDaysAllowed: 15, seats: 2, onSale: true },
]

/** The earliest a pass may start: memberships sold before the CRM are entered as backlog from here. */
export const EARLIEST_START = '2026-08-01'

export type Offer ={ planKey: string; label: string; amount: number }

export const OFFERS: Offer[] = [
  { planKey: 'annual', label: 'Festival offer', amount: 1000 },
]

export function findPlan(key: string) {
  return PLANS.find((plan) => plan.key === key)
}
