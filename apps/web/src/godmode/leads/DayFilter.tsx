import { useRef } from 'react'
import { Button, Calendar, DatePicker } from '@heroui/react'
import { getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { LuX } from 'react-icons/lu'
import { todayLocal } from './shared'

export function DayFilter({
  day,
  onChange,
}: {
  day: string
  onChange: (day: string) => void
}) {
  const max = today(getLocalTimeZone())
  const value = day ? parseDate(day) : null
  /* DatePicker.Popover doesn't wire itself to the trigger, so without this the
     calendar anchors to the viewport corner. */
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  return (
    <div className="flex items-center gap-2">
      <DatePicker
        aria-label="Filter by day"
        value={value}
        maxValue={max}
        onChange={(date) => onChange(date ? date.toString() : '')}
      >
        <DatePicker.Trigger ref={triggerRef} className="min-w-40 justify-between">
          <span className={day ? undefined : 'text-field-placeholder'}>
            {value
              ? value.toDate(getLocalTimeZone()).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Any day'}
          </span>
          <DatePicker.TriggerIndicator />
        </DatePicker.Trigger>
        <DatePicker.Popover triggerRef={triggerRef}>
          {/* maxValue on the root validates but doesn't reach the grid — a
              future date stays clickable without this. */}
          <Calendar maxValue={max}>
            <Calendar.Header>
              <Calendar.NavButton slot="previous" />
              <Calendar.Heading />
              <Calendar.NavButton slot="next" />
            </Calendar.Header>
            <Calendar.Grid>
              <Calendar.GridHeader>
                {(weekday) => <Calendar.HeaderCell>{weekday}</Calendar.HeaderCell>}
              </Calendar.GridHeader>
              <Calendar.GridBody>
                {(date) => <Calendar.Cell date={date} />}
              </Calendar.GridBody>
            </Calendar.Grid>
          </Calendar>
        </DatePicker.Popover>
      </DatePicker>

      {day ? (
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          aria-label="Clear the day filter"
          onPress={() => onChange('')}
        >
          <LuX className="size-4" />
        </Button>
      ) : (
        <Button variant="secondary" size="sm" onPress={() => onChange(todayLocal())}>
          Today
        </Button>
      )}
    </div>
  )
}
