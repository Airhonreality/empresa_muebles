import { List } from 'lucide-react'
import type { CalendarRecord, EventRecord, TagRecord } from '../model/types'
import { formatDayLabel, formatTime } from '../model/date'
import { eventStyle } from '../model/theme'

export function AgendaList({
  events,
  tags,
  calendars,
  emptyLabel,
  onEdit,
}: {
  events: EventRecord[]
  tags: TagRecord[]
  calendars: CalendarRecord[]
  emptyLabel: string
  onEdit: (record: EventRecord) => void
}) {
  if (events.length === 0) {
    return (
      <div className="rounded-md border bg-card p-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {events.map(record => (
        <button
          key={record.id}
          type="button"
          onClick={() => onEdit(record)}
          className="flex w-full gap-3 rounded-md border-l-4 px-3 py-3 text-left"
          style={eventStyle(record, calendars, tags)}
        >
          <List size={16} className="mt-0.5 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{record.data.title}</span>
            <span className="block text-xs opacity-75">
              {formatDayLabel(new Date(record.data.start))} · {formatTime(record.data.start)}
              {record.data.status ? ` · ${record.data.status}` : ''}
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}
