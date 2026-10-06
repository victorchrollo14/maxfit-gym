import { Button, Input, Label, ListBox, Select, TextField } from '@heroui/react'
import { todayIST } from '@/lib/dates'
import { formatINR } from '@/lib/format'
import { METHODS } from '@/api/memberships'
import { DayPicker } from '@/godmode/DayPicker'
import type { PaymentDraft } from './payment'
import { methodLabel } from './shared'

export function PaymentFields({
  draft,
  onChange,
  payers,
  max,
}: {
  draft: PaymentDraft
  onChange: (draft: PaymentDraft) => void
  payers: { id: string; name: string }[]
  max: number
}) {
  const set = (changes: Partial<PaymentDraft>) => onChange({ ...draft, ...changes })
  const amount = Number(draft.amount)

  return (
    <div className="flex flex-col gap-4">
      <TextField variant="secondary" value={draft.amount} onChange={(amount) => set({ amount })} isRequired>
        <Label>Amount (₹)</Label>
        <Input inputMode="decimal" />
        <p className="mt-1 text-xs text-muted">
          {amount > 0 && amount < max
            ? `Part payment: ${formatINR(max - amount)} will still be due`
            : `${formatINR(max)} left to pay`}
        </p>
      </TextField>

      <div className="flex flex-col gap-1.5">
        <Label>Method</Label>
        <div className="flex gap-2">
          {METHODS.map((method) => (
            <Button
              key={method}
              size="sm"
              variant={draft.method === method ? 'primary' : 'secondary'}
              className="flex-1"
              onPress={() => set({ method })}
            >
              {methodLabel[method]}
            </Button>
          ))}
        </div>
      </div>

      {draft.method !== 'cash' && (
        <TextField variant="secondary" value={draft.reference} onChange={(reference) => set({ reference })} isRequired>
          <Label>{draft.method === 'upi' ? 'UPI transaction ID' : 'Card slip number'}</Label>
          <Input />
        </TextField>
      )}

      <DayPicker
        label="Paid on"
        value={draft.paidOn}
        onChange={(paidOn) => set({ paidOn })}
        max={todayIST()}
        isRequired
      />

      {payers.length > 1 && (
        <Select
          variant="secondary"
          aria-label="Paid by"
          value={draft.paidBy}
          onChange={(value) => set({ paidBy: value as string })}
        >
          <Label>Paid by</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {payers.map((payer) => (
                <ListBox.Item key={payer.id} id={payer.id} textValue={payer.name}>
                  {payer.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      )}

      <TextField variant="secondary" value={draft.note} onChange={(note) => set({ note })}>
        <Label>Note</Label>
        <Input placeholder="Optional" />
      </TextField>
    </div>
  )
}
