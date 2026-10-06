import { useEffect, useState } from 'react'
import {
  Button,
  Drawer,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
  Toast,
} from '@heroui/react'
import { getSupabase } from '@/lib/supabase'
import { todayIST } from '@/lib/dates'
import { GENDERS } from '@/api/members'
import { DayPicker } from '@/godmode/DayPicker'
import { PROFILE_FIELDS, genderLabel, type Profile } from './shared'

/* Profiles aren't one of the server-only tables (D18): admin-claim RLS covers
   this update, as it does for leads. The phone is the member's login, so it
   isn't edited here. */
export function EditMember({
  member,
  isOpen,
  onClose,
  onSaved,
}: {
  member: Profile
  isOpen: boolean
  onClose: () => void
  onSaved: (member: Profile) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [gender, setGender] = useState('')
  const [dob, setDob] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setName(member.name)
    setEmail(member.email ?? '')
    setGender(member.gender ?? '')
    setDob(member.dob ?? '')
    setNotes(member.notes ?? '')
  }, [isOpen, member])

  const dirty =
    name !== member.name ||
    email !== (member.email ?? '') ||
    gender !== (member.gender ?? '') ||
    dob !== (member.dob ?? '') ||
    notes !== (member.notes ?? '')

  const save = async () => {
    if (!name.trim()) {
      Toast.toast.danger('A name is required.')
      return
    }
    setSaving(true)
    const { data, error } = await getSupabase()
      .from('user_profiles')
      .update({
        name: name.trim(),
        email: email.trim() || null,
        gender: gender || null,
        dob: dob || null,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', member.id)
      .select(PROFILE_FIELDS)
      .single()
    setSaving(false)

    if (error) {
      console.error('member update failed', error)
      Toast.toast.danger('Could not save the changes.')
      return
    }
    Toast.toast.success('Details saved')
    onSaved(data as Profile)
  }

  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Content placement="right">
        <Drawer.Dialog
          aria-label="Edit details"
          className="flex h-full w-full flex-col items-start p-0 sm:max-w-md"
        >
          <Drawer.Header className="w-full px-5 pt-5">
            <h2 className="display text-xl">Edit details</h2>
          </Drawer.Header>

          <Drawer.Body className="flex w-full flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
            <TextField variant="secondary" value={name} onChange={setName} isRequired>
              <Label>Name</Label>
              <Input />
            </TextField>

            <TextField variant="secondary" value={email} onChange={setEmail} type="email">
              <Label>Email</Label>
              <Input placeholder="Optional" />
            </TextField>

            <Select
              variant="secondary"
              aria-label="Gender"
              placeholder="Optional"
              value={gender || null}
              onChange={(value) => setGender((value as string | null) ?? '')}
            >
              <Label>Gender</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {GENDERS.map((key) => (
                    <ListBox.Item key={key} id={key} textValue={genderLabel[key]}>
                      {genderLabel[key]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <DayPicker label="Date of birth" value={dob} onChange={setDob} max={todayIST()} placeholder="Optional" />

            <TextField variant="secondary" value={notes} onChange={setNotes}>
              <Label>Notes</Label>
              <TextArea rows={5} placeholder="Injuries, goals, anything worth knowing" />
            </TextField>
          </Drawer.Body>

          <Drawer.Footer className="w-full gap-2 px-5 pb-5">
            <Button variant="secondary" onPress={onClose}>
              Cancel
            </Button>
            <Button variant="primary" isDisabled={!dirty} isPending={saving} onPress={save}>
              Save
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  )
}
