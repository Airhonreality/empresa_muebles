import type { CalendarView, EventRecord, FilterState } from './types'
import { ALL_FILTER_VALUE, EMPTY_FILTER_VALUE } from './types'
import { addDays, sameDay } from './date'
import { parseIds } from './values'

export function filterEvents(records: EventRecord[], filters: FilterState): EventRecord[] {
  return records.filter(record => {
    if (filters.calendar_id !== ALL_FILTER_VALUE && (record.data.calendar_id || EMPTY_FILTER_VALUE) !== filters.calendar_id) return false
    if (filters.status !== ALL_FILTER_VALUE && (record.data.status || EMPTY_FILTER_VALUE) !== filters.status) return false
    if (filters.tag_id !== ALL_FILTER_VALUE && !parseIds(record.data.tag_ids).includes(filters.tag_id)) return false
    return true
  })
}

export function getVisibleEvents(params: {
  events: EventRecord[]
  view: CalendarView
  activeDate: Date
  monthDays: Date[]
  weekDays: Date[]
}): EventRecord[] {
  const { events, view, activeDate, monthDays, weekDays } = params

  if (view === 'month') {
    const first = monthDays[0]
    const last = addDays(monthDays[monthDays.length - 1], 1)
    return events.filter(record => {
      const start = new Date(record.data.start)
      return start >= first && start < last
    })
  }

  if (view === 'week') {
    const first = weekDays[0]
    const last = addDays(weekDays[6], 1)
    return events.filter(record => {
      const start = new Date(record.data.start)
      return start >= first && start < last
    })
  }

  return events.filter(record => sameDay(new Date(record.data.start), activeDate))
}

export function groupEventsByDay(events: EventRecord[]): Map<string, EventRecord[]> {
  const map = new Map<string, EventRecord[]>()
  for (const record of events) {
    const date = new Date(record.data.start)
    date.setHours(0, 0, 0, 0)
    const key = date.toISOString()
    map.set(key, [...(map.get(key) ?? []), record])
  }
  return map
}

export function getStatuses(events: EventRecord[]): string[] {
  return Array.from(new Set(events.map(record => record.data.status?.trim()).filter(Boolean) as string[])).sort()
}
