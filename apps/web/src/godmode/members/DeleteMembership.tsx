import { useState } from 'react'
import { Button, Modal, Toast } from '@heroui/react'
import { formatINR } from '@/lib/format'
import { formatDay } from '@/lib/dates'
import { deleteMembership } from '@/api/memberships'
import { errorMessage, type Membership, type Payment } from './shared'

export function DeleteMembership({
  membership,
  payments,
  onClose,
  onDeleted,
}: {
  membership: Membership | null
  payments: Payment[]
  onClose: () => void
  onDeleted: () => void
}) {
  const [saving, setSaving] = useState(false)

  if (!membership) return null

  const m = membership
  const seats = m.member_ids?.length ?? 1
  const paid = payments.filter((p) => p.status === 'paid')

  const remove = async () => {
    setSaving(true)
    try {
      await deleteMembership({ data: { membershipId: m.membership_id } })
      Toast.toast.success('Membership deleted')
      onDeleted()
    } catch (error) {
      Toast.toast.danger(errorMessage(error))
    }
    setSaving(false)
  }

  return (
    <Modal.Backdrop isOpen onOpenChange={(open) => !open && onClose()}>
      <Modal.Container size="sm">
        <Modal.Dialog>
          <Modal.Header>
            <Modal.Heading>Delete this membership?</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-3 text-sm text-muted">
            <p>
              <span className="font-medium text-foreground">{m.plan_name}</span>, {formatDay(m.start_date)} –{' '}
              {formatDay(m.end_date)}
              {seats > 1 && `, for all ${seats} members on it`}.
            </p>
            <p>
              {payments.length === 0
                ? 'It has no payments.'
                : `Its ${payments.length === 1 ? 'payment' : `${payments.length} payments`}${
                    paid.length > 0
                      ? ` (${formatINR(paid.reduce((sum, p) => sum + Number(p.amount), 0))} paid)`
                      : ''
                  } and any pauses go with it.`}{' '}
              This can't be undone.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onPress={onClose}>
              Keep it
            </Button>
            <Button variant="danger" isPending={saving} onPress={remove}>
              Delete membership
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
