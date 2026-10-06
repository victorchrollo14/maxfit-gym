import type { ReactNode } from 'react'
import { Button, ListBox, Popover, RangeCalendar } from '@heroui/react'
import { parseDate } from '@internationalized/date'
import { LuChevronDown } from 'react-icons/lu'
import { addDays, formatDay, todayIST } from '@/lib/dates'

function Pill({ label, value, children }: { label: string; value?: string; children: ReactNode }) {
  return (
    <Popover>
      <Button
        size="sm"
        variant={value ? 'secondary' : 'ghost'}
        className="max-w-72 rounded-full font-normal"
      >
        <span className="truncate">
          {label}
          {value && <span className="font-medium">: {value}</span>}
        </span>
        <LuChevronDown className="size-3.5 shrink-0 opacity-60" />
      </Button>
      <Popover.Content placement="bottom start" className="max-w-[calc(100vw-2rem)]">
        <Popover.Dialog aria-label={label} className="p-0">
          {children}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  )
}

function Footer({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex justify-end border-t border-border p-1.5">
      <Button size="sm" variant="ghost" onPress={onClear}>
        Clear
      </Button>
    </div>
  )
}

/** Pick any number of options; none picked means no filter. */
export function ListFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: (readonly [key: string, label: string, count?: number])[]
  value: string[] | undefined
  onChange: (value: string[] | undefined) => void
}) {
  const selected = value ?? []
  const names = options.filter(([key]) => selected.includes(key)).map(([, text]) => text)
  const summary =
    names.length === 0 ? undefined : names.length === 1 ? names[0] : `${names[0]} +${names.length - 1}`

  return (
    <Pill label={label} value={summary}>
      <div className="w-56">
        <ListBox
          aria-label={label}
          selectionMode="multiple"
          escapeKeyBehavior="none"
          selectedKeys={new Set(selected)}
          onSelectionChange={(keys) => {
            const next = keys === 'all' ? options.map(([key]) => key) : [...keys].map(String)
            onChange(next.length ? next : undefined)
          }}
          className="max-h-72 overflow-y-auto p-1.5"
        >
          {options.map(([key, text, count]) => (
            <ListBox.Item key={key} id={key} textValue={text}>
              {text}
              {count !== undefined && <span className="ms-auto text-xs text-muted tabular-nums">{count}</span>}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
        {selected.length > 0 && <Footer onClear={() => onChange(undefined)} />}
      </div>
    </Pill>
  )
}

export type DayRange = { from: string; to: string }

const PRESETS = {
  today: 'Today',
  last7: 'Last 7 days',
  last30: 'Last 30 days',
  next7: 'Next 7 days',
  next30: 'Next 30 days',
  thisMonth: 'This month',
  lastMonth: 'Last month',
  nextMonth: 'Next month',
} as const

export type Preset = keyof typeof PRESETS

function monthOf(day: string, offset: number): DayRange {
  const first = new Date(`${day.slice(0, 7)}-01T00:00:00Z`)
  first.setUTCMonth(first.getUTCMonth() + offset)
  const next = new Date(first)
  next.setUTCMonth(next.getUTCMonth() + 1)
  return { from: first.toISOString().slice(0, 10), to: addDays(next.toISOString().slice(0, 10), -1) }
}

function presetRange(preset: Preset, today: string): DayRange {
  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case 'last7':
      return { from: addDays(today, -6), to: today }
    case 'last30':
      return { from: addDays(today, -29), to: today }
    case 'next7':
      return { from: today, to: addDays(today, 6) }
    case 'next30':
      return { from: today, to: addDays(today, 29) }
    case 'thisMonth':
      return monthOf(today, 0)
    case 'lastMonth':
      return monthOf(today, -1)
    case 'nextMonth':
      return monthOf(today, 1)
  }
}

/** A from–to range of days, from a preset or the calendar. Both ends set, or neither. */
export function DateFilter({
  label,
  presets,
  value,
  onChange,
}: {
  label: string
  presets: Preset[]
  value: DayRange
  onChange: (value: DayRange) => void
}) {
  const today = todayIST()
  const isSet = Boolean(value.from && value.to)
  const matched = presets.find((p) => {
    const range = presetRange(p, today)
    return range.from === value.from && range.to === value.to
  })
  const summary = !isSet
    ? undefined
    : matched
      ? PRESETS[matched]
      : value.from === value.to
        ? formatDay(value.from)
        : `${formatDay(value.from)} – ${formatDay(value.to)}`

  return (
    <Pill label={label} value={summary}>
      <div className="flex flex-col sm:flex-row">
        <ListBox
          aria-label={`${label} presets`}
          selectionMode="single"
          selectedKeys={matched ? [matched] : []}
          onAction={(key) => onChange(presetRange(key as Preset, today))}
          className="p-1.5 sm:w-40 sm:border-e sm:border-border"
        >
          {presets.map((p) => (
            <ListBox.Item key={p} id={p} textValue={PRESETS[p]}>
              {PRESETS[p]}
            </ListBox.Item>
          ))}
        </ListBox>
        <div className="flex flex-col">
          <RangeCalendar
            aria-label={label}
            value={isSet ? { start: parseDate(value.from), end: parseDate(value.to) } : null}
            onChange={(next) => onChange({ from: next.start.toString(), to: next.end.toString() })}
            className="p-2"
          >
            <RangeCalendar.Header>
              <RangeCalendar.YearPickerTrigger>
                <RangeCalendar.YearPickerTriggerHeading />
                <RangeCalendar.YearPickerTriggerIndicator />
              </RangeCalendar.YearPickerTrigger>
              <RangeCalendar.NavButton slot="previous" />
              <RangeCalendar.NavButton slot="next" />
            </RangeCalendar.Header>
            <RangeCalendar.Grid>
              <RangeCalendar.GridHeader>
                {(weekday) => <RangeCalendar.HeaderCell>{weekday}</RangeCalendar.HeaderCell>}
              </RangeCalendar.GridHeader>
              <RangeCalendar.GridBody>{(day) => <RangeCalendar.Cell date={day} />}</RangeCalendar.GridBody>
            </RangeCalendar.Grid>
            <RangeCalendar.YearPickerGrid>
              <RangeCalendar.YearPickerGridBody>
                {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
              </RangeCalendar.YearPickerGridBody>
            </RangeCalendar.YearPickerGrid>
          </RangeCalendar>
          {isSet && <Footer onClear={() => onChange({ from: '', to: '' })} />}
        </div>
      </div>
    </Pill>
  )
}
