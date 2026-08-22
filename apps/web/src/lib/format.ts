const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatINR(amount: number) {
  return inr.format(amount)
}

const list = new Intl.ListFormat('en-IN', { style: 'long', type: 'conjunction' })

export function formatList(items: readonly string[]) {
  return list.format(items)
}
