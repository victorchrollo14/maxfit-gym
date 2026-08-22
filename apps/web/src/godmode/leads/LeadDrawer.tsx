import { useEffect, useState } from 'react'
import {
  Button,
  Chip,
  Drawer,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
  Toast,
} from '@heroui/react'
import { LuCopy, LuPhone } from 'react-icons/lu'
import { FaWhatsapp } from 'react-icons/fa'
import { getSupabase } from '../../lib/supabase'
import {
  type Lead,
  SETTABLE_STATUSES,
  SOURCES,
  fullDate,
  prettyPhone,
  sourceLabel,
  waHref,
} from './shared'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3">
      <span className="eyebrow text-[10px] text-muted">{label}</span>
      <div className="text-sm">{children}</div>
    </div>
  )
}

export function LeadDrawer({
  lead,
  onClose,
  onSaved,
}: {
  lead: Lead | null
  onClose: () => void
  onSaved: (lead: Lead) => void
}) {
  const [notes, setNotes] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setNotes(lead?.notes ?? '')
    setName(lead?.name ?? '')
    setEmail(lead?.email ?? '')
  }, [lead])

  if (!lead) return null

  const dirty =
    notes !== (lead.notes ?? '') ||
    name !== lead.name ||
    email !== (lead.email ?? '')

  const patch = async (changes: Partial<Lead>, done?: string) => {
    setSaving(true)
    const { data, error } = await getSupabase()
      .from('leads')
      .update(changes)
      .eq('id', lead.id)
      .select()
      .single()
    setSaving(false)

    if (error) {
      console.error('lead update failed', error)
      Toast.toast.danger('Could not save that change.')
      return
    }
    onSaved(data as Lead)
    if (done) Toast.toast.success(done)
  }

  return (
    <Drawer.Backdrop isOpen onOpenChange={(open) => !open && onClose()}>
      <Drawer.Content placement="right">
        <Drawer.Dialog
          aria-label={`Lead ${lead.name}`}
          className="flex h-full w-full flex-col items-start p-0 sm:max-w-md"
        >
          <Drawer.Header className="w-full items-start px-5 pt-5">
            <div className="flex w-full items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="display truncate text-xl">{lead.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {sourceLabel[lead.source] ?? lead.source} ·{' '}
                  {fullDate(lead.created_at)}
                </p>
              </div>
              {lead.status === 'converted' && (
                <Chip size="sm" variant="soft" color="success">
                  converted
                </Chip>
              )}
            </div>
          </Drawer.Header>

          <Drawer.Body className="w-full flex-1 overflow-y-auto px-5">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onPress={() => window.open(`tel:${lead.phone}`, '_self')}
              >
                <LuPhone className="size-4" />
                Call
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onPress={() => window.open(waHref(lead.phone), '_blank')}
              >
                <FaWhatsapp className="size-4" />
                WhatsApp
              </Button>
            </div>

            <Row label="Phone">
              <div className="flex items-center gap-2">
                <span className="tabular-nums">{prettyPhone(lead.phone)}</span>
                <button
                  type="button"
                  aria-label="Copy phone number"
                  className="rounded p-1 text-muted hover:text-foreground"
                  onClick={async () => {
                    await navigator.clipboard.writeText(lead.phone)
                    Toast.toast.success('Phone number copied')
                  }}
                >
                  <LuCopy className="size-3.5" />
                </button>
              </div>
            </Row>

            <Row label="Status">
              {lead.status === 'converted' ? (
                <span className="text-muted">
                  Converted on {fullDate(lead.converted_at ?? lead.created_at)}
                </span>
              ) : (
                <Select
                  aria-label="Status"
                  variant="secondary"
                  value={lead.status}
                  onChange={(value) => patch({ status: value as string }, 'Status updated')}
                >
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {SETTABLE_STATUSES.map((key) => (
                        <ListBox.Item key={key} id={key} textValue={key}>
                          {key}
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              )}
            </Row>

            <Row label="Source">
              <Select
                aria-label="Source"
                variant="secondary"
                value={lead.source}
                onChange={(value) => patch({ source: value as string }, 'Source updated')}
              >
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
            </Row>

            <div className="flex flex-col gap-4 py-4">
              <TextField value={name} onChange={setName}>
                <Label>Name</Label>
                <Input />
              </TextField>

              <TextField value={email} onChange={setEmail} type="email">
                <Label>Email</Label>
                <Input placeholder="None on file" />
              </TextField>

              <TextField value={notes} onChange={setNotes}>
                <Label>Notes</Label>
                <TextArea rows={6} placeholder="What did they ask about?" />
              </TextField>
            </div>
          </Drawer.Body>

          <Drawer.Footer className="w-full gap-2 px-5 pb-5">
            <Button variant="secondary" onPress={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              isDisabled={!dirty}
              isPending={saving}
              onPress={() =>
                patch(
                  {
                    name: name.trim(),
                    email: email.trim() || null,
                    notes: notes.trim() || null,
                  },
                  'Lead saved',
                )
              }
            >
              Save
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  )
}
