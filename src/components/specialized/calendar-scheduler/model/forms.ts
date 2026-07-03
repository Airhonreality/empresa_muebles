import type { EventFormState, EventRecord } from './types'
import { parseIds } from './values'
import { toDatetimeLocalValue } from './date'

export function emptyEventForm(selectedDate: Date): EventFormState {
  const start = new Date(selectedDate)
  start.setHours(9, 0, 0, 0)

  const end = new Date(selectedDate)
  end.setHours(10, 0, 0, 0)

  return {
    title: '',
    description: '',
    start: toDatetimeLocalValue(start),
    end: toDatetimeLocalValue(end),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    status: '',
    tag_ids: [],
    calendar_id: '',
    owner_id: '',
  }
}

export function eventFormFromRecord(record: EventRecord): EventFormState {
  return {
    id: record.id,
    title: record.data.title ?? '',
    description: record.data.description ?? '',
    start: toDatetimeLocalValue(new Date(record.data.start)),
    end: toDatetimeLocalValue(new Date(record.data.end)),
    timezone: record.data.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC',
    status: record.data.status ?? '',
    tag_ids: parseIds(record.data.tag_ids),
    calendar_id: record.data.calendar_id ?? '',
    owner_id: record.data.owner_id ?? '',
  }
}
