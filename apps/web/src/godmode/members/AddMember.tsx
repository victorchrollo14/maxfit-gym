import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Alert,
  Button,
  Disclosure,
  Drawer,
  Input,
  InputOTP,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
  Toast,
} from '@heroui/react'
import { LuCircleCheck, LuShieldCheck } from 'react-icons/lu'
import { FaWhatsapp } from 'react-icons/fa'
import { getSupabase } from '@/lib/supabase'
import { todayIST } from '@/lib/dates'
import { DayPicker } from '@/godmode/DayPicker'
import { normalisePhone } from '@/lib/leads'
import {
  GENDERS,
  cancelPhoneCode,
  checkPhoneCode,
  createMember,
  sendPhoneCode,
  type Gender,
} from '@/api/members'
import { errorMessage, genderLabel } from './shared'

export type MemberPrefill = {
  name?: string
  phone?: string
  email?: string | null
  notes?: string | null
  leadId?: string
}

type Lookup = {
  member: { id: string; name: string } | null
  openLead: { id: string; name: string } | null
}

type Verification =
  | { kind: 'none' }
  | { kind: 'sent'; userId: string; sentAt: number }
  | { kind: 'code'; userId: string }
  | { kind: 'admin'; userId?: string }

const RESEND_AFTER = 30

export function AddMember({
  isOpen,
  prefill,
  onClose,
  onCreated,
  onLinked,
}: {
  isOpen: boolean
  prefill?: MemberPrefill
  onClose: () => void
  onCreated: (memberId: string) => void
  /** From a lead whose number is already a member: the lead was linked instead. */
  onLinked?: (memberId: string) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [dob, setDob] = useState('')
  const [notes, setNotes] = useState('')
  const [lookup, setLookup] = useState<Lookup | null>(null)
  const [verification, setVerification] = useState<Verification>({ kind: 'none' })
  const [code, setCode] = useState('')
  const [sendError, setSendError] = useState('')
  const [busy, setBusy] = useState<'send' | 'check' | 'create' | 'link' | null>(null)
  const [now, setNow] = useState(Date.now())

  const normalised = normalisePhone(phone)
  const leadId = prefill?.leadId

  // Kept in a ref so closing the drawer can clean up whatever was sent last.
  const pendingUser = useRef<string | null>(null)
  pendingUser.current =
    verification.kind === 'sent' || (verification.kind === 'admin' && verification.userId)
      ? (verification.userId ?? null)
      : null

  useEffect(() => {
    if (!isOpen) return
    setName(prefill?.name ?? '')
    setPhone(prefill?.phone?.replace(/^\+91/, '') ?? '')
    setEmail(prefill?.email ?? '')
    setGender('')
    setDob('')
    setNotes(prefill?.notes ?? '')
    setVerification({ kind: 'none' })
    setCode('')
    setSendError('')
  }, [isOpen, prefill])

  // A new number needs verifying again; drop the half-made user for the old one.
  useEffect(() => {
    if (pendingUser.current) cancelPhoneCode({ data: { userId: pendingUser.current } })
    setVerification({ kind: 'none' })
    setCode('')
    setSendError('')
  }, [normalised])

  useEffect(() => {
    if (!normalised) {
      setLookup(null)
      return
    }
    let cancelled = false
    const supabase = getSupabase()
    Promise.all([
      supabase
        .from('user_profiles')
        .select('id, name, created_by')
        .eq('phone', normalised)
        .maybeSingle(),
      supabase
        .from('leads')
        .select('id, name')
        .eq('phone', normalised)
        .not('status', 'in', '(converted,lost)')
        .order('created_at', { ascending: false })
        .limit(1),
    ]).then(([members, leads]) => {
      if (cancelled) return
      const member = members.data?.created_by ? members.data : null
      const openLead = leads.data?.find((lead) => lead.id !== leadId) ?? null
      setLookup({ member, openLead })
    })
    return () => {
      cancelled = true
    }
  }, [normalised, leadId])

  useEffect(() => {
    if (verification.kind !== 'sent') return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [verification.kind])

  const close = () => {
    if (pendingUser.current) cancelPhoneCode({ data: { userId: pendingUser.current } })
    onClose()
  }

  const send = async () => {
    if (!normalised) return
    if (!name.trim()) {
      Toast.toast.danger('Add the name first, so the code goes to the right person.')
      return
    }
    setBusy('send')
    setSendError('')
    try {
      const { userId } = await sendPhoneCode({ data: { phone: normalised, name } })
      setVerification({ kind: 'sent', userId, sentAt: Date.now() })
      setNow(Date.now())
      setCode('')
    } catch (error) {
      setSendError(errorMessage(error))
    }
    setBusy(null)
  }

  const check = async () => {
    if (verification.kind !== 'sent' || !normalised) return
    setBusy('check')
    try {
      await checkPhoneCode({ data: { phone: normalised, code } })
      setVerification({ kind: 'code', userId: verification.userId })
    } catch (error) {
      Toast.toast.danger(errorMessage(error))
    }
    setBusy(null)
  }

  const verifyByAdmin = () => {
    setVerification((current) => ({
      kind: 'admin',
      userId: current.kind === 'sent' ? current.userId : undefined,
    }))
    setSendError('')
  }

  const create = async () => {
    if (!normalised || (verification.kind !== 'code' && verification.kind !== 'admin')) return
    setBusy('create')
    try {
      const { memberId } = await createMember({
        data: {
          name,
          phone: normalised,
          verifiedBy: verification.kind,
          userId: verification.userId,
          email,
          gender: gender || null,
          dob: dob || null,
          notes,
          leadId,
        },
      })
      pendingUser.current = null
      Toast.toast.success(`${name.trim()} added`)
      onCreated(memberId)
    } catch (error) {
      Toast.toast.danger(errorMessage(error))
    }
    setBusy(null)
  }

  const linkLead = async () => {
    if (!leadId || !lookup?.member) return
    setBusy('link')
    const { error } = await getSupabase()
      .from('leads')
      .update({
        user_id: lookup.member.id,
        status: 'converted',
        converted_at: new Date().toISOString(),
      })
      .eq('id', leadId)
    setBusy(null)
    if (error) {
      console.error('lead link failed', error)
      Toast.toast.danger('Could not link the lead.')
      return
    }
    Toast.toast.success(`Lead linked to ${lookup.member.name}`)
    onLinked?.(lookup.member.id)
  }

  const existing = lookup?.member
  const verified = verification.kind === 'code' || verification.kind === 'admin'
  const canCreate = Boolean(name.trim() && normalised && !existing && verified)
  const resendIn =
    verification.kind === 'sent'
      ? Math.max(0, RESEND_AFTER - Math.floor((now - verification.sentAt) / 1000))
      : 0

  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && close()}>
      <Drawer.Content placement="right">
        <Drawer.Dialog
          aria-label="Add member"
          className="flex h-full w-full flex-col items-start p-0 sm:max-w-md"
        >
          <Drawer.Header className="w-full px-5 pt-5">
            <h2 className="display text-xl">{leadId ? 'Convert to member' : 'Add member'}</h2>
          </Drawer.Header>

          <Drawer.Body className="flex w-full flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
            <TextField variant="secondary" value={name} onChange={setName} isRequired autoFocus>
              <Label>Name</Label>
              <Input placeholder="Full name" />
            </TextField>

            <TextField variant="secondary" value={phone} onChange={setPhone} type="tel" isRequired>
              <Label>Phone</Label>
              <Input placeholder="10-digit mobile" inputMode="tel" />
            </TextField>

            {existing && (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{existing.name} already has this number</Alert.Title>
                  <Alert.Description>
                    <Link
                      to="/godmode/members/$memberId"
                      params={{ memberId: existing.id }}
                      className="underline"
                      onClick={close}
                    >
                      Open their member page
                    </Link>
                  </Alert.Description>
                  {leadId && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-2"
                      isPending={busy === 'link'}
                      onPress={linkLead}
                    >
                      Link lead to {existing.name}
                    </Button>
                  )}
                </Alert.Content>
              </Alert>
            )}

            {!existing && lookup?.openLead && (
              <Alert status="warning">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Open lead: {lookup.openLead.name}</Alert.Title>
                  <Alert.Description>It will be marked converted.</Alert.Description>
                </Alert.Content>
              </Alert>
            )}

            {normalised && !existing && (
              <section className="flex flex-col gap-3 rounded-xl border border-border p-4">
                <p className="eyebrow text-[10px] text-muted">Verify phone</p>

                {verification.kind === 'code' && (
                  <p className="flex items-center gap-2 text-sm text-success">
                    <LuCircleCheck className="size-4" /> Verified by WhatsApp code
                  </p>
                )}

                {verification.kind === 'admin' && (
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm text-success">
                      <LuShieldCheck className="size-4" /> Verified by you
                    </p>
                    <Button size="sm" variant="ghost" onPress={() => setVerification({ kind: 'none' })}>
                      Undo
                    </Button>
                  </div>
                )}

                {(verification.kind === 'none' || verification.kind === 'sent') && (
                  <>
                    {verification.kind === 'none' ? (
                      <Button variant="secondary" isPending={busy === 'send'} onPress={send}>
                        <FaWhatsapp className="size-4" />
                        Send WhatsApp code
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Label>Code sent on WhatsApp</Label>
                        <InputOTP variant="secondary" maxLength={6} value={code} onChange={setCode}>
                          <InputOTP.Group>
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                              <InputOTP.Slot key={index} index={index} />
                            ))}
                          </InputOTP.Group>
                        </InputOTP>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            isDisabled={code.length !== 6}
                            isPending={busy === 'check'}
                            onPress={check}
                          >
                            Check code
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            isDisabled={resendIn > 0}
                            isPending={busy === 'send'}
                            onPress={send}
                          >
                            {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {sendError && (
                      <Alert status="danger">
                        <Alert.Indicator />
                        <Alert.Content>
                          <Alert.Title>{sendError}</Alert.Title>
                          {sendError.startsWith("Couldn't send") && (
                            <Alert.Description>
                              If you've already spoken to them on this number, verify it yourself below.
                            </Alert.Description>
                          )}
                        </Alert.Content>
                      </Alert>
                    )}

                    <Button variant="ghost" size="sm" onPress={verifyByAdmin}>
                      <LuShieldCheck className="size-4" />
                      I've verified this number
                    </Button>
                  </>
                )}
              </section>
            )}

            <Disclosure>
              <Disclosure.Heading>
                <Disclosure.Trigger className="flex w-full items-center justify-between py-1 text-sm font-medium">
                  More details
                  <Disclosure.Indicator />
                </Disclosure.Trigger>
              </Disclosure.Heading>
              <Disclosure.Content>
                <Disclosure.Body className="flex flex-col gap-4 pt-3">
                  <TextField variant="secondary" value={email} onChange={setEmail} type="email">
                    <Label>Email</Label>
                    <Input placeholder="Optional" />
                  </TextField>

                  <Select
                    variant="secondary"
                    aria-label="Gender"
                    placeholder="Optional"
                    value={gender || null}
                    onChange={(value) => setGender((value as Gender | null) ?? '')}
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
                    <TextArea rows={3} placeholder="Injuries, goals, anything worth knowing" />
                  </TextField>
                </Disclosure.Body>
              </Disclosure.Content>
            </Disclosure>
          </Drawer.Body>

          <Drawer.Footer className="w-full gap-2 px-5 pb-5">
            <Button variant="secondary" onPress={close}>
              Cancel
            </Button>
            <Button
              variant="primary"
              isDisabled={!canCreate}
              isPending={busy === 'create'}
              onPress={create}
            >
              Create member
            </Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  )
}
