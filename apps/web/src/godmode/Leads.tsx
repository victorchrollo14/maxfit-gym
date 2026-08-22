import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  Chip,
  Input,
  Label,
  ListBox,
  Modal,
  SearchField,
  Select,
  Spinner,
  Table,
  TextArea,
  TextField,
  Toast,
} from '@heroui/react'
import { LuPhone, LuPlus, LuRefreshCw } from 'react-icons/lu'
import { FaWhatsapp } from 'react-icons/fa'
import { getSupabase } from '../lib/supabase'
import { normalisePhone } from '../lib/leads'
import { useGodmode } from './context'
import { PageHeader } from './PageHeader'

type Lead = {
  id: string
  name: string
  phone: string
  email: string | null
  source: string
  status: string
  notes: string | null
  converted_at: string | null
  created_at: string
}

const STATUSES = ['new', 'hot', 'warm', 'cold', 'converted', 'lost'] as const

/* `converted` is set by the conversion flow, not by hand: the table's check
   constraint ties it to converted_at. */
const SETTABLE = ['new', 'hot', 'warm', 'cold', 'lost'] as const

const SOURCES = ['walk_in', 'call', 'whatsapp', 'referral', 'free_trial'] as const

const sourceLabel: Record<string, string> = {
  walk_in: 'Walk-in',
  call: 'Call',
  whatsapp: 'WhatsApp',
  referral: 'Referral',
  free_trial: 'Free trial',
}

const statusColor: Record<string, 'default' | 'accent' | 'success' | 'warning' | 'danger'> = {
  new: 'accent',
  hot: 'danger',
  warm: 'warning',
  cold: 'default',
  converted: 'success',
  lost: 'default',
}

const ALL = '__all__'

function prettyPhone(phone: string) {
  const match = /^\+91(\d{5})(\d{5})$/.exec(phone)
  return match ? `+91 ${match[1]} ${match[2]}` : phone
}

function dayBounds(day: string) {
  const start = new Date(`${day}T00:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { from: start.toISOString(), to: end.toISOString() }
}

const todayLocal = () => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 10)
}

function AddLead({ onAdded }: { onAdded: () => void }) {
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
    const { error } = await getSupabase()
      .from('leads')
      .insert({
        name: name.trim(),
        phone: normalised,
        email: email.trim() || null,
        source,
        notes: notes.trim() || null,
        admin_id: session.user.id,
      })
    setSaving(false)

    if (error) {
      console.error('lead insert failed', error)
      Toast.toast.danger('Could not save the lead.')
      return
    }

    Toast.toast.success('Lead added')
    reset()
    setOpen(false)
    onAdded()
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

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [day, setDay] = useState('')
  const [status, setStatus] = useState<string>(ALL)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    let request = getSupabase()
      .from('leads')
      .select('id, name, phone, email, source, status, notes, converted_at, created_at')
      .order('created_at', { ascending: false })
      .limit(500)

    if (day) {
      const { from, to } = dayBounds(day)
      request = request.gte('created_at', from).lt('created_at', to)
    }
    if (status !== ALL) request = request.eq('status', status)

    const { data, error } = await request
    if (error) {
      console.error('leads select failed', error)
      Toast.toast.danger('Could not load leads.')
    }
    setLeads((data as Lead[] | null) ?? [])
    setLoading(false)
  }, [day, status])

  useEffect(() => {
    load()
  }, [load])

  const setLeadStatus = async (lead: Lead, next: string) => {
    setLeads((current) =>
      current.map((row) => (row.id === lead.id ? { ...row, status: next } : row)),
    )
    const { error } = await getSupabase()
      .from('leads')
      .update({ status: next })
      .eq('id', lead.id)

    if (error) {
      console.error('lead status update failed', error)
      Toast.toast.danger('Could not update that lead.')
      load()
    }
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return leads
    return leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(needle) ||
        lead.phone.includes(needle.replace(/\D/g, '')),
    )
  }, [leads, query])

  return (
    <>
      <PageHeader
        title="Leads"
        actions={
          <>
            <Button
              isIconOnly
              variant="ghost"
              aria-label="Refresh"
              isPending={loading}
              onPress={load}
            >
              <LuRefreshCw className="size-4" />
            </Button>
            <AddLead onAdded={load} />
          </>
        }
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end gap-3">
          <SearchField
            aria-label="Search leads"
            value={query}
            onChange={setQuery}
            className="min-w-52 flex-1"
          >
            <Input placeholder="Search name or phone" />
          </SearchField>

          <Select
            aria-label="Status"
            value={status}
            onChange={(value) => setStatus(value as string)}
            className="w-40"
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id={ALL} textValue="All statuses">
                  All statuses
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                {STATUSES.map((key) => (
                  <ListBox.Item key={key} id={key} textValue={key}>
                    {key}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              aria-label="Filter by day"
              value={day}
              max={todayLocal()}
              onChange={(e) => setDay(e.target.value)}
              className="h-10 rounded-(--field-radius) border border-border bg-field-background px-3 text-sm text-field-foreground"
            />
            <Button
              variant="secondary"
              size="sm"
              onPress={() => setDay(day === todayLocal() ? '' : todayLocal())}
            >
              {day === todayLocal() ? 'All days' : 'Today'}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted">
          {visible.length} {visible.length === 1 ? 'lead' : 'leads'}
          {day ? ` on ${day}` : ''}
        </p>

        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Leads">
              <Table.Header>
                <Table.Column id="name" isRowHeader>
                  NAME
                </Table.Column>
                <Table.Column id="phone">PHONE</Table.Column>
                <Table.Column id="source">SOURCE</Table.Column>
                <Table.Column id="status">STATUS</Table.Column>
                <Table.Column id="notes">NOTES</Table.Column>
                <Table.Column id="created">RECEIVED</Table.Column>
              </Table.Header>
              <Table.Body
                items={visible}
                renderEmptyState={() =>
                  loading ? (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted">
                      Nothing here yet.
                    </p>
                  )
                }
              >
                {(lead: Lead) => (
                  <Table.Row key={lead.id} id={lead.id}>
                    <Table.Cell>
                      <span className="font-medium">{lead.name}</span>
                      {lead.email && (
                        <span className="block text-xs text-muted">{lead.email}</span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-1">
                        <span className="tabular-nums whitespace-nowrap">
                          {prettyPhone(lead.phone)}
                        </span>
                        <a
                          href={`tel:${lead.phone}`}
                          aria-label={`Call ${lead.name}`}
                          className="rounded p-1.5 text-muted hover:bg-surface hover:text-foreground"
                        >
                          <LuPhone className="size-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/${lead.phone.replace('+', '')}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`WhatsApp ${lead.name}`}
                          className="rounded p-1.5 text-muted hover:bg-surface hover:text-foreground"
                        >
                          <FaWhatsapp className="size-3.5" />
                        </a>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm text-muted">
                        {sourceLabel[lead.source] ?? lead.source}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      {lead.status === 'converted' ? (
                        <Chip size="sm" variant="soft" color="success">
                          converted
                        </Chip>
                      ) : (
                        <Select
                          aria-label={`Status for ${lead.name}`}
                          variant="secondary"
                          value={lead.status}
                          onChange={(value) => setLeadStatus(lead, value as string)}
                        >
                          <Select.Trigger>
                            <Chip size="sm" variant="soft" color={statusColor[lead.status]}>
                              {lead.status}
                            </Chip>
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              {SETTABLE.map((key) => (
                                <ListBox.Item key={key} id={key} textValue={key}>
                                  {key}
                                  <ListBox.ItemIndicator />
                                </ListBox.Item>
                              ))}
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <span className="line-clamp-2 max-w-56 text-sm text-muted">
                        {lead.notes ?? '—'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-sm whitespace-nowrap text-muted">
                        {new Date(lead.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>
    </>
  )
}
