import type { CalendarRecord, EventRecord, TagRecord } from '../model/types'
import { eventStyle } from '../model/theme'

export function EventPill({
  record,
  tags,
  calendars,
  onClick,
}: {
  record: EventRecord
  tags: TagRecord[]
  calendars: CalendarRecord[]
  onClick: () => void
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={event => {
        event.stopPropagation()
        onClick()
      }}
      className="block truncate rounded border-l-4 px-2 py-1 text-xs"
      style={eventStyle(record, calendars, tags)}
    >
      {record.data.title}
    </span>
  )
}
