const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatINR(amount: number) {
  return inr.format(amount)
}

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 })

/** Short amounts for chart axes, e.g. ₹15K or ₹1.2L. */
export function compactINR(amount: number) {
  return `₹${compact.format(amount)}`
}

const list = new Intl.ListFormat('en-IN', { style: 'long', type: 'conjunction' })

export function formatList(items: readonly string[]) {
  return list.format(items)
}
