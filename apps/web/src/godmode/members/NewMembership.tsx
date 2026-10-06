import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Checkbox,
  Chip,
  ComboBox,
  Drawer,
  Input,
  Label,
  ListBox,
  Radio,
  RadioGroup,
  TextField,
  Toast,
  cn,
} from '@heroui/react'
import { LuPlus, LuX } from 'react-icons/lu'
import { getSupabase } from '@/lib/supabase'
import { addDays, formatDay, todayIST } from '@/lib/dates'
import { formatINR } from '@/lib/format'
import { EARLIEST_START, OFFERS, PLANS, findPlan } from '@/plans'
import { createMembership } from '@/api/memberships'
import { DayPicker } from '@/godmode/DayPicker'
import { AddMember } from './AddMember'
import { PaymentFields } from './PaymentFields'
import { newPaymentDraft, paymentProblem, toPayment, type PaymentDraft } from './payment'
import { prettyPhone } from '@/godmode/leads/shared'
import { errorMessage, loadMembers, type Profile } from './shared'

type Person = { id: string; name: string; phone?: string | null }

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-4 text-sm', strong && 'font-semibold')}>
      <span className={strong ? undefined : 'text-muted'}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

export function NewMembership({
  member,
  isOpen,
  defaultPlanKey,
  onClose,
  onCreated,
}: {
  member: Profile
  isOpen: boolean
  defaultPlanKey?: string
  onClose: () => void
  onCreated: () => void
}) {
  const onSale = PLANS.filter((plan) => plan.onSale)
  const [planKey, setPlanKey] = useState('')
  const [partner, setPartner] = useState<Person | null>(null)
  const [partnerQuery, setPartnerQuery] = useState('')
  const [members, setMembers] = useState<Profile[]>([])
  const [addingPartner, setAddingPartner] = useState(false)
  const [startDate, setStartDate] = useState(todayIST())
  const [discount, setDiscount] = useState('')
  const [reason, setReason] = useState('')
  const [payNow, setPayNow] = useState(true)
  const [draft, setDraft] = useState<PaymentDraft>(() => newPaymentDraft(0, member.id))
  const [saving, setSaving] = useState(false)

  const plan = findPlan(planKey)
  const seats = plan?.seats ?? 1
  const discountAmount = Number(discount) || 0
  const due = plan ? Math.max(plan.price - discountAmount, 0) : 0
  const endDate = plan && startDate ? addDays(startDate, plan.durationDays - 1) : null

  useEffect(() => {
    if (!isOpen) return
    setPlanKey(defaultPlanKey && findPlan(defaultPlanKey)?.onSale ? defaultPlanKey : '')
    setPartner(null)
    setPartnerQuery('')
    setStartDate(todayIST())
    setDiscount('')
    setReason('')
    setPayNow(true)
    setDraft((current) => newPaymentDraft(Number(current.amount), member.id))
  }, [isOpen, defaultPlanKey, member.id])

  // The payment follows the amount due until the admin lowers it.
  useEffect(() => {
    setDraft((current) => ({ ...current, amount: String(due) }))
  }, [due])

  useEffect(() => {
    if (seats < 2 || members.length > 0) return
    loadMembers()
      .then(setMembers)
      .catch(() => Toast.toast.danger('Could not load members.'))
  }, [seats, members.length])

  const partnerOptions = useMemo(
    () => members.filter((m) => m.id !== member.id),
    [members, member.id],
  )

  const payers: Person[] = partner ? [member, partner] : [member]

  const problem = (() => {
    if (!plan) return 'Pick a plan'
    if (seats > 1 && !partner) return 'Pick the second member'
    if (!startDate || startDate < EARLIEST_START) return `Start date can't be before ${formatDay(EARLIEST_START)}`
    if (discountAmount < 0 || discountAmount > plan.price) return 'Discount is more than the price'
    if (discountAmount > 0 && !reason.trim()) return 'Add a reason for the discount'
    if (payNow && due > 0) return paymentProblem(draft, due)
    return null
  })()

  const pickPlan = (key: string) => {
    setPlanKey(key)
    setDiscount('')
    setReason('')
    if ((findPlan(key)?.seats ?? 1) < 2) setPartner(null)
  }

  const pickPartner = async (id: string) => {
    const { data } = await getSupabase()
      .from('user_profiles')
      .select('id, name, phone')
      .eq('id', id)
      .single()
    if (data) setPartner(data)
    setPartnerQuery('')
  }

  const save = async () => {
    if (!plan) return
    setSaving(true)
    try {
      await createMembership({
        data: {
          planKey: plan.key,
          memberIds: partner ? [member.id, partner.id] : [member.id],
          startDate,
          discountAmount,
          discountReason: reason,
          payment: payNow && due > 0 ? toPayment(draft) : undefined,
        },
      })
      Toast.toast.success(`${plan.name} created`)
      onCreated()
    } catch (error) {
      Toast.toast.danger(errorMessage(error))
    }
    setSaving(false)
  }

  return (
    <>
      <Drawer.Backdrop isOpen={isOpen && !addingPartner} onOpenChange={(open) => !open && onClose()}>
        <Drawer.Content placement="right">
          <Drawer.Dialog
            aria-label="New membership"
            className="flex h-full w-full flex-col items-start p-0 sm:max-w-lg"
          >
            <Drawer.Header className="w-full px-5 pt-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="display text-xl">New membership</h2>
                <span className="text-lg font-medium text-muted">{member.name}</span>
              </div>
            </Drawer.Header>

            <Drawer.Body className="flex w-full flex-1 flex-col gap-6 overflow-y-auto px-5 py-4">
              <RadioGroup value={planKey || null} onChange={pickPlan} className="flex flex-col gap-2">
                <Label>Plan</Label>
                <div className="grid grid-cols-2 gap-2">
                  {onSale.map((option) => (
                    <Radio
                      key={option.key}
                      value={option.key}
                      className="mt-0! rounded-xl border border-border p-3 transition-colors hover:bg-surface data-[selected=true]:border-accent data-[selected=true]:bg-accent/10"
                    >
                      <Radio.Content className="items-start">
                        <Radio.Control className="mt-0.5">
                          <Radio.Indicator />
                        </Radio.Control>
                        <span className="flex flex-col">
                          <span>{option.name}</span>
                          <span className="tabular-nums">{formatINR(option.price)}</span>
                          <span className="mt-1 text-xs font-normal text-muted">
                            {option.durationDays} days
                            {option.pauseDaysAllowed > 0 && ` · ${option.pauseDaysAllowed} pause days`}
                            {option.seats > 1 && ` · ${option.seats} people`}
                          </span>
                        </span>
                      </Radio.Content>
                    </Radio>
                  ))}
                </div>
              </RadioGroup>

              {seats > 1 && (
                <section className="flex flex-col gap-1.5">
                  <Label>Second member</Label>
                  {partner ? (
                    <div className="flex">
                      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1 ps-3 pe-1 text-sm">
                        <span className="font-medium">{partner.name}</span>
                        {partner.phone && (
                          <span className="text-muted tabular-nums">{prettyPhone(partner.phone)}</span>
                        )}
                        <Button
                          isIconOnly
                          size="sm"
                          variant="ghost"
                          aria-label={`Remove ${partner.name}`}
                          className="size-6 min-w-6 rounded-full"
                          onPress={() => setPartner(null)}
                        >
                          <LuX className="size-3.5" />
                        </Button>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <ComboBox
                        variant="secondary"
                        aria-label="Second member"
                        className="flex-1"
                        inputValue={partnerQuery}
                        onInputChange={setPartnerQuery}
                        selectedKey={null}
                        onSelectionChange={(key) => key && pickPartner(String(key))}
                        defaultFilter={(text, input) => {
                          const digits = input.replace(/\D/g, '')
                          const [name, phone] = text.split('|')
                          return (
                            name.toLowerCase().includes(input.trim().toLowerCase()) ||
                            (digits.length > 0 && phone.includes(digits))
                          )
                        }}
                        menuTrigger="focus"
                      >
                        <ComboBox.InputGroup>
                          <Input placeholder="Search name or number" />
                          <ComboBox.Trigger />
                        </ComboBox.InputGroup>
                        <ComboBox.Popover>
                          <ListBox
                            renderEmptyState={() => (
                              <p className="px-3 py-2 text-sm text-muted">Nobody matches</p>
                            )}
                          >
                            {partnerOptions.map((m) => (
                              <ListBox.Item key={m.id} id={m.id} textValue={`${m.name}|${m.phone ?? ''}`}>
                                <span className="flex w-full justify-between gap-3">
                                  <span>{m.name}</span>
                                  <span className="text-muted tabular-nums">
                                    {m.phone ? prettyPhone(m.phone) : ''}
                                  </span>
                                </span>
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </ComboBox.Popover>
                      </ComboBox>
                      <Button variant="secondary" onPress={() => setAddingPartner(true)}>
                        <LuPlus className="size-4" />
                        New
                      </Button>
                    </div>
                  )}
                </section>
              )}

              <DayPicker
                label="Start date"
                value={startDate}
                onChange={setStartDate}
                min={EARLIEST_START}
                isRequired
              />
              {startDate && startDate < todayIST() && (
                <p className="-mt-2 text-xs text-muted">
                  Backdated: entering a pass that started {formatDay(startDate)}.
                </p>
              )}

              {plan && (
                <section className="flex flex-col gap-3">
                  <div className="grid grid-cols-[8rem_1fr] gap-2">
                    <TextField variant="secondary" value={discount} onChange={setDiscount}>
                      <Label>Discount (₹)</Label>
                      <Input inputMode="decimal" placeholder="0" />
                    </TextField>
                    <TextField variant="secondary" value={reason} onChange={setReason} isRequired={discountAmount > 0}>
                      <Label>Discount reason</Label>
                      <Input placeholder="e.g. Referral from Arjun" />
                    </TextField>
                  </div>
                  {OFFERS.filter((offer) => offer.planKey === plan.key).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {OFFERS.filter((offer) => offer.planKey === plan.key).map((offer) => (
                        <button
                          key={offer.label}
                          type="button"
                          onClick={() => {
                            setDiscount(String(offer.amount))
                            setReason(offer.label)
                          }}
                        >
                          <Chip size="sm" variant="soft" color="accent">
                            {offer.label} −{formatINR(offer.amount)}
                          </Chip>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {plan && (
                <section className="flex flex-col gap-2 rounded-xl bg-surface-secondary p-4">
                  <SummaryRow label={plan.name} value={formatINR(plan.price)} />
                  {discountAmount > 0 && (
                    <SummaryRow label={`Discount${reason.trim() ? `: ${reason.trim()}` : ''}`} value={`− ${formatINR(discountAmount)}`} />
                  )}
                  <SummaryRow label="Amount due" value={formatINR(due)} strong />
                  {endDate && (
                    <SummaryRow label="Runs" value={`${formatDay(startDate)} – ${formatDay(endDate)}`} />
                  )}
                  <SummaryRow
                    label="Pause days"
                    value={plan.pauseDaysAllowed > 0 ? String(plan.pauseDaysAllowed) : 'None'}
                  />
                </section>
              )}

              {plan && due > 0 && (
                <section className="flex flex-col gap-4">
                  <Checkbox isSelected={payNow} onChange={setPayNow}>
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                      <Label>Add a payment now</Label>
                    </Checkbox.Content>
                  </Checkbox>
                  {payNow ? (
                    <PaymentFields draft={draft} onChange={setDraft} payers={payers} max={due} />
                  ) : (
                    <p className="text-sm text-muted">The full {formatINR(due)} will show as due.</p>
                  )}
                </section>
              )}
            </Drawer.Body>

            <Drawer.Footer className="w-full gap-2 px-5 pb-5">
              <Button variant="secondary" onPress={onClose}>
                Cancel
              </Button>
              <Button variant="primary" isDisabled={Boolean(problem)} isPending={saving} onPress={save}>
                {problem ?? 'Create membership'}
              </Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>

      <AddMember
        isOpen={addingPartner}
        onClose={() => setAddingPartner(false)}
        onCreated={(id) => {
          setAddingPartner(false)
          setMembers([])
          pickPartner(id)
        }}
      />
    </>
  )
}
