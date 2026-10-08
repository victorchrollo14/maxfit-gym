import { useEffect, useState } from 'react'
import { Button, Label, Modal, TextArea, TextField, Toast } from '@heroui/react'
import { formatINR } from '@/lib/format'
import { formatDateTime } from '@/lib/dates'
import { voidPayment } from '@/api/memberships'
import { errorMessage, methodLabel, type Payment } from './shared'

export function VoidPayment({
  payment,
  onClose,
  onVoided,
}: {
  payment: Payment | null
  onClose: () => void
  onVoided: () => void
}) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => setReason(''), [payment])

  if (!payment) return null

  const save = async () => {
    setSaving(true)
    try {
      await voidPayment({ data: { paymentId: payment.id, reason } })
      Toast.toast.success('Payment cancelled')
      onVoided()
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
            <Modal.Heading>Cancel this payment?</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-4">
            <p className="text-sm text-muted">
              {formatINR(Number(payment.amount))} · {methodLabel[payment.method] ?? payment.method} ·{' '}
              {formatDateTime(payment.paid_at)}. It stays in the history, marked cancelled, and can't
              be undone. Enter it again if the amount was wrong.
            </p>
            <TextField variant="secondary" value={reason} onChange={setReason} isRequired autoFocus>
              <Label>Reason</Label>
              <TextArea rows={2} placeholder="e.g. Entered twice, wrong amount" />
            </TextField>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onPress={onClose}>
              Keep it
            </Button>
            <Button
              variant="danger"
              isDisabled={!reason.trim()}
              isPending={saving}
              onPress={save}
            >
              Cancel payment
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
