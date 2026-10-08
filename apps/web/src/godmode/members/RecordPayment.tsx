import { useEffect, useState } from 'react'
import { Button, Drawer, Toast } from '@heroui/react'
import { formatINR } from '@/lib/format'
import { recordPayment } from '@/api/memberships'
import { PaymentFields } from './PaymentFields'
import { newPaymentDraft, paymentProblem, toPayment, type PaymentDraft } from './payment'
import { errorMessage, type Membership } from './shared'

export function RecordPayment({
  membership,
  payers,
  defaultPayer,
  onClose,
  onSaved,
}: {
  membership: Membership | null
  payers: { id: string; name: string }[]
  defaultPayer: string
  onClose: () => void
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<PaymentDraft>(() => newPaymentDraft(0, defaultPayer))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (membership) setDraft(newPaymentDraft(Number(membership.amount_pending), defaultPayer))
  }, [membership, defaultPayer])

  if (!membership) return null
  const pending = Number(membership.amount_pending)
  const problem = paymentProblem(draft, pending)

  const save = async () => {
    setSaving(true)
    try {
      await recordPayment({ data: { ...toPayment(draft), membershipId: membership.membership_id } })
      Toast.toast.success(`${formatINR(Number(draft.amount))} added`)
      onSaved()
    } catch (error) {
      Toast.toast.danger(errorMessage(error))
    }
    setSaving(false)
  }

  return (
    <Drawer.Backdrop isOpen onOpenChange={(open) => !open && onClose()}>
      <Drawer.Content placement="right">
        <Drawer.Dialog
          aria-label="Add payment"
          className="flex h-full w-full flex-col items-start p-0 sm:max-w-md"
        >
          <Drawer.Header className="w-full px-5 pt-5">
            <h2 className="display text-xl">Add payment</h2>
            <p className="mt-1 text-sm text-muted">
              {membership.plan_name} · {formatINR(Number(membership.amount_due))} due,{' '}
              {formatINR(pending)} pending
            </p>
          </Drawer.Header>
          <Drawer.Body className="w-full flex-1 overflow-y-auto px-5 py-4">
            <PaymentFields draft={draft} onChange={setDraft} payers={payers} max={pending} />
          </Drawer.Body>
          <Drawer.Footer className="w-full gap-2 px-5 pb-5">
            <Button variant="secondary" onPress={onClose}>
              Cancel
            </Button>
            <Button variant="primary" isDisabled={Boolean(problem)} isPending={saving} onPress={save}>
              {problem ?? 'Add payment'}
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  )
}
