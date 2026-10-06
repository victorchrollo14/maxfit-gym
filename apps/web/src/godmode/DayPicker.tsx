import { useRef } from 'react'
import { Button, Calendar, DatePicker, Label } from '@heroui/react'
import { parseDate } from '@internationalized/date'
import { LuX } from 'react-icons/lu'
import { formatDay } from '@/lib/dates'

/** A YYYY-MM-DD day, picked from HeroUI's calendar. */
export function DayPicker({
  label,
  value,
  onChange,
  min,
  max,
  placeholder = 'Pick a day',
  isRequired,
}: {
  label: string
  value: string
  onChange: (day: string) => void
  min?: string
  max?: string
  placeholder?: string
  isRequired?: boolean
}) {
  const minValue = min ? parseDate(min) : undefined
  const maxValue = max ? parseDate(max) : undefined
  /* DatePicker.Popover doesn't wire itself to the trigger, so without this the
     calendar anchors to the viewport corner. */
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  return (
    <DatePicker
      value={value ? parseDate(value) : null}
      minValue={minValue}
      maxValue={maxValue}
      isRequired={isRequired}
      onChange={(next) => onChange(next ? next.toString() : '')}
      className="flex flex-col gap-1.5"
    >
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <DatePicker.Trigger
          ref={triggerRef}
          className="min-h-9 flex-1 justify-between bg-default px-3 py-2 hover:bg-default-hover"
        >
          <span className={value ? undefined : 'text-field-placeholder'}>
            {value ? formatDay(value) : placeholder}
          </span>
          <DatePicker.TriggerIndicator />
        </DatePicker.Trigger>
        {value && !isRequired && (
          <Button isIconOnly variant="ghost" size="sm" aria-label={`Clear ${label}`} onPress={() => onChange('')}>
            <LuX className="size-4" />
          </Button>
        )}
      </div>
      <DatePicker.Popover triggerRef={triggerRef}>
        {/* min/max on the root validate but don't reach the grid, so they go here too. */}
        <Calendar minValue={minValue} maxValue={maxValue}>
          <Calendar.Header>
            <Calendar.YearPickerTrigger>
              <Calendar.YearPickerTriggerHeading />
              <Calendar.YearPickerTriggerIndicator />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton slot="previous" />
            <Calendar.NavButton slot="next" />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(weekday) => <Calendar.HeaderCell>{weekday}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>{(day) => <Calendar.Cell date={day} />}</Calendar.GridBody>
          </Calendar.Grid>
          <Calendar.YearPickerGrid>
            <Calendar.YearPickerGridBody>
              {({ year }) => <Calendar.YearPickerCell year={year} />}
            </Calendar.YearPickerGridBody>
          </Calendar.YearPickerGrid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  )
}
