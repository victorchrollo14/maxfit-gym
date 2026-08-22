import { useState } from 'react'
import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextArea,
  TextField,
  Toast,
} from '@heroui/react'
import { LuPlus } from 'react-icons/lu'
import { getSupabase } from '../../lib/supabase'
import { normalisePhone } from '../../lib/leads'
import { useGodmode } from '../context'
import { LEAD_FIELDS, SOURCES, type Lead, sourceLabel } from './shared'

export function AddLead({ onAdded }: { onAdded: (lead: Lead) => void }) {
  const { session } = useGodmode()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [source, setSource] = useState<string>('walk_in')
  const [notes, setNotes] = useState('')

  const reset = () => {
    setName('')
    setPhone('')
    setEmail('')
    setSource('walk_in')
    setNotes('')
  }

  const save = async () => {
    const normalised = normalisePhone(phone)
    if (!name.trim()) {
      Toast.toast.danger('A name is required.')
      return
    }
    if (!normalised) {
      Toast.toast.danger("That doesn't look like a mobile number.")
      return
    }

    setSaving(true)
    const { data, error } = await getSupabase()
      .from('leads')
      .insert({
        name: name.trim(),
        phone: normalised,
        email: email.trim() || null,
        source,
        notes: notes.trim() || null,
        admin_id: session.user.id,
      })
      .select(LEAD_FIELDS)
      .single()
    setSaving(false)

    if (error) {
      console.error('lead insert failed', error)
      Toast.toast.danger('Could not save the lead.')
      return
    }

    Toast.toast.success('Lead added')
    reset()
    setOpen(false)
    onAdded(data as Lead)
  }

  return (
    <>
      <Button variant="primary" size="sm" onPress={() => setOpen(true)}>
        <LuPlus className="size-4" />
        Add lead
      </Button>

      <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Modal.Container size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Add a walk-in</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <TextField value={name} onChange={setName} isRequired autoFocus>
                <Label>Name</Label>
                <Input placeholder="Full name" />
              </TextField>

              <TextField value={phone} onChange={setPhone} type="tel" isRequired>
                <Label>Phone</Label>
                <Input placeholder="10-digit mobile" inputMode="tel" />
              </TextField>

              <TextField value={email} onChange={setEmail} type="email">
                <Label>Email</Label>
                <Input placeholder="Optional" />
              </TextField>

              <Select
                aria-label="Source"
                value={source}
                onChange={(value) => setSource(value as string)}
              >
                <Label>Source</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {SOURCES.map((key) => (
                      <ListBox.Item key={key} id={key} textValue={sourceLabel[key]}>
                        {sourceLabel[key]}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              <TextField value={notes} onChange={setNotes}>
                <Label>Notes</Label>
                <TextArea placeholder="What did they ask about?" rows={3} />
              </TextField>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onPress={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" isPending={saving} onPress={save}>
                Save lead
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  )
}
