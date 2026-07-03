import type { CalendarRecord, EventRecord, TagRecord } from '../model/types'
import { formatDayLabel, formatTime, HOUR_MARKS, startOfDay } from '../model/date'
import { eventStyle } from '../model/theme'
import { computeCalendarLayout, type CalendarLayoutEvent } from '../layout/calendar-layout'

export function TimeGridView({
  days,
  eventsByDay,
  tags,
  calendars,
  onCreate,
  onEdit,
}: {
  days: Date[]
  eventsByDay: Map<string, EventRecord[]>
  tags: TagRecord[]
  calendars: CalendarRecord[]
  onCreate: (date: Date) => void
  onEdit: (record: EventRecord) => void
}) {
  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <div className="grid border-b bg-muted/30" style={{ gridTemplateColumns: `72px repeat(${days.length}, minmax(0, 1fr))` }}>
        <div />
        {days.map(day => (
          <button key={day.toISOString()} type="button" onClick={() => onCreate(day)} className="px-3 py-3 text-left hover:opacity-80">
            <div className="text-xs uppercase text-muted-foreground">{formatDayLabel(day).split(',')[0]}</div>
            <div className="text-sm font-semibold">{formatDayLabel(day)}</div>
          </button>
        ))}
      </div>
      <div className="grid" style={{ gridTemplateColumns: `72px repeat(${days.length}, minmax(0, 1fr))` }}>
        <div className="border-r bg-muted/30">
          {HOUR_MARKS.map(hour => (
            <div key={hour} className="h-20 border-b px-2 pt-1 text-xs text-muted-foreground">
              {String(hour).padStart(2, '0')}:00
            </div>
          ))}
        </div>
        {days.map(day => {
          const key = startOfDay(day).toISOString()
          const dayEvents = eventsByDay.get(key) ?? []
          const layoutEvents: Array<CalendarLayoutEvent & { record: EventRecord }> = dayEvents.map(record => ({
            id: record.id,
            start: new Date(record.data.start),
            end: new Date(record.data.end),
            record,
          }))
          const positioned = computeCalendarLayout(layoutEvents, 7, 19)

          return (
            <div key={key} className="relative h-[960px] border-r" onDoubleClick={() => onCreate(day)}>
              {HOUR_MARKS.map(hour => (
                <div key={hour} className="h-20 border-b" />
              ))}
              {positioned.map(item => (
                <button
                  key={item.event.id}
                  type="button"
                  onClick={() => onEdit(item.event.record)}
                  className="absolute overflow-hidden rounded-md border-l-4 px-2 py-1 text-left text-xs shadow-sm"
                  style={{
                    ...eventStyle(item.event.record, calendars, tags),
                    top: `${item.top}%`,
                    height: `${Math.max(item.height, 4)}%`,
                    left: `calc(${item.left}% + 3px)`,
                    width: `calc(${item.width}% - 6px)`,
                  }}
                >
                  <span className="block truncate font-medium">{item.event.record.data.title}</span>
                  <span className="block truncate opacity-75">
                    {formatTime(item.event.record.data.start)} - {formatTime(item.event.record.data.end)}
                  </span>
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
