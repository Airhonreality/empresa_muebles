import type { EventData, EventRecord } from './types'
import { addDays } from './date'
import { writeRecord } from './persistence'

function shiftByOneDay(startIso: string, endIso: string) {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const durationMs = end.getTime() - start.getTime()
  const nextStart = addDays(start, 1)
  const nextEnd = new Date(nextStart.getTime() + durationMs)

  return {
    nextStart: nextStart.toISOString(),
    nextEnd: nextEnd.toISOString(),
  }
}

export async function updateEventStatus(namespace: string, record: EventRecord, status: string) {
  await writeRecord<EventData>(namespace, record.id, {
    ...record.data,
    event_thread_id: record.data.event_thread_id ?? record.id,
    status,
  })
}

export async function postponeEvent(namespace: string, record: EventRecord) {
  const { nextStart, nextEnd } = shiftByOneDay(record.data.start, record.data.end)
  const threadId = record.data.event_thread_id ?? record.id

  await writeRecord<EventData>(namespace, record.id, {
    ...record.data,
    event_thread_id: threadId,
    status: 'postponed',
  })

  await writeRecord<EventData>(namespace, undefined, {
    ...record.data,
    start: nextStart,
    end: nextEnd,
    status: record.data.status || 'pending',
    previous_start: record.data.start,
    previous_end: record.data.end,
    parent_event_id: record.id,
    event_thread_id: threadId,
  })
}
