import { useEffect, useState } from 'react'
import { Button, ComboBox, Input, ListBox, Toast } from '@heroui/react'
import { LuPlus, LuX } from 'react-icons/lu'
import { prettyPhone } from '@/godmode/leads/shared'
import { loadMembers, loadPerson, type Person, type Profile } from './shared'

export function PartnerPicker({
  value,
  excludeIds,
  onChange,
  onAddNew,
}: {
  value: Person | null
  excludeIds: string[]
  onChange: (person: Person | null) => void
  onAddNew: () => void
}) {
  const [query, setQuery] = useState('')
  const [members, setMembers] = useState<Profile[]>([])

  useEffect(() => {
    if (value) return
    loadMembers()
      .then(setMembers)
      .catch(() => Toast.toast.danger('Could not load members.'))
  }, [value])

  if (value) {
    return (
      <div className="flex">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1 ps-3 pe-1 text-sm">
          <span className="font-medium">{value.name}</span>
          {value.phone && <span className="text-muted tabular-nums">{prettyPhone(value.phone)}</span>}
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Remove ${value.name}`}
            className="size-6 min-w-6 rounded-full"
            onPress={() => onChange(null)}
          >
            <LuX className="size-3.5" />
          </Button>
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <ComboBox
        variant="secondary"
        aria-label="Second member"
        className="flex-1"
        inputValue={query}
        onInputChange={setQuery}
        selectedKey={null}
        onSelectionChange={async (key) => {
          if (!key) return
          setQuery('')
          onChange(await loadPerson(String(key)))
        }}
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
          <ListBox renderEmptyState={() => <p className="px-3 py-2 text-sm text-muted">Nobody matches</p>}>
            {members
              .filter((m) => !excludeIds.includes(m.id))
              .map((m) => (
                <ListBox.Item key={m.id} id={m.id} textValue={`${m.name}|${m.phone ?? ''}`}>
                  <span className="flex w-full justify-between gap-3">
                    <span>{m.name}</span>
                    <span className="text-muted tabular-nums">{m.phone ? prettyPhone(m.phone) : ''}</span>
                  </span>
                </ListBox.Item>
              ))}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>
      <Button variant="secondary" onPress={onAddNew}>
        <LuPlus className="size-4" />
        New
      </Button>
    </div>
  )
}
