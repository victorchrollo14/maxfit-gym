import { useEffect, useState } from 'react'
import { Button, Label, Modal, Toast } from '@heroui/react'
import { formatDay } from '@/lib/dates'
import { addPartner } from '@/api/memberships'
import { AddMember } from './AddMember'
import { PartnerPicker } from './PartnerPicker'
import { errorMessage, loadPerson, type Membership, type Person } from './shared'

export function AddPartner({
  membership,
  onClose,
  onAdded,
}: {
  membership: Membership | null
  onClose: () => void
  onAdded: () => void
}) {
  const [partner, setPartner] = useState<Person | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => setPartner(null), [membership])

  if (!membership) return null

  const save = async () => {
    if (!partner) return
    setSaving(true)
    try {
      await addPartner({ data: { membershipId: membership.membership_id, memberId: partner.id } })
      Toast.toast.success(`${partner.name || 'Partner'} added`)
      onAdded()
    } catch (error) {
      Toast.toast.danger(errorMessage(error))
    }
    setSaving(false)
  }

  return (
    <>
      <Modal.Backdrop isOpen={!addingNew} onOpenChange={(open) => !open && onClose()}>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Add partner</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <p className="text-sm text-muted">
                {membership.plan_name}, {formatDay(membership.start_date)} – {formatDay(membership.end_date)}.
              </p>
              <section className="flex flex-col gap-1.5">
                <Label>Second member</Label>
                <PartnerPicker
                  value={partner}
                  excludeIds={membership.member_ids ?? []}
                  onChange={setPartner}
                  onAddNew={() => setAddingNew(true)}
                />
              </section>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={onClose}>
                Cancel
              </Button>
              <Button variant="primary" isDisabled={!partner} isPending={saving} onPress={save}>
                Add partner
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <AddMember
        isOpen={addingNew}
        onClose={() => setAddingNew(false)}
        onCreated={(id) => {
          setAddingNew(false)
          loadPerson(id).then(setPartner)
        }}
      />
    </>
  )
}
