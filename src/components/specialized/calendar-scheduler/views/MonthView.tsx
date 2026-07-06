import type { CalendarRecord, EventRecord, TagRecord } from '../model/types'
import { DAY_NAMES, sameDay, startOfDay } from '../model/date'
import { EventPill } from '../primitives/EventPill'

export function MonthView({
  activeDate,
  days,
  eventsByDay,
  tags,
  calendars,
  onSelectDate,
  onCreate,
  onEdit,
}: {
  activeDate: Date
  days: Date[]
  eventsByDay: Map<string, EventRecord[]>
  tags: TagRecord[]
  calendars: CalendarRecord[]
  onSelectDate: (date: Date) => void
  onCreate: (date: Date) => void
  onEdit: (record: EventRecord) => void
}) {
  const activeMonth = activeDate.getMonth()

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {DAY_NAMES.map(day => (
          <div key={day} className="px-3 py-2 text-xs font-medium uppercase text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map(day => {
          const key = startOfDay(day).toISOString()
          const dayEvents = eventsByDay.get(key) ?? []
          const isMuted = day.getMonth() !== activeMonth
          const isSelected = sameDay(day, activeDate)

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(day)}
              onDoubleClick={() => onCreate(day)}
              className={`min-h-32 border-b border-r p-2 text-left transition hover:opacity-80 ${
                isSelected ? 'bg-muted/40' : 'bg-card'
              } ${
                isMuted ? 'text-muted-foreground' : 'text-foreground'
              }`}
            >
              <span
                className={`inline-grid h-7 w-7 place-items-center rounded-md text-sm ${
                  sameDay(day, new Date()) ? 'bg-primary text-primary-foreground' : ''
                }`}
              >
                {day.getDate()}
              </span>
              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 4).map(record => (
                  <EventPill key={record.id} record={record} tags={tags} calendars={calendars} onClick={() => onEdit(record)} />
                ))}
                {dayEvents.length > 4 && <span className="block text-xs text-muted-foreground">+{dayEvents.length - 4} more</span>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
