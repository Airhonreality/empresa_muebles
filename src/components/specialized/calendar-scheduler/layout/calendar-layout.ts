export interface CalendarLayoutEvent {
  id: string
  start: Date
  end: Date
}

export interface PositionedCalendarEvent<T extends CalendarLayoutEvent = CalendarLayoutEvent> {
  event: T
  top: number
  height: number
  left: number
  width: number
}

const MINUTES_PER_HOUR = 60
const MS_PER_MINUTE = 60_000

function overlaps(a: CalendarLayoutEvent, b: CalendarLayoutEvent): boolean {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime()
}

function minutesFromDayStart(date: Date, dayStartHour: number): number {
  const dayStart = new Date(date)
  dayStart.setHours(dayStartHour, 0, 0, 0)
  return (date.getTime() - dayStart.getTime()) / MS_PER_MINUTE
}

export function computeCalendarLayout<T extends CalendarLayoutEvent>(
  events: T[],
  dayStartHour = 0,
  dayEndHour = 24,
): PositionedCalendarEvent<T>[] {
  if (events.length === 0) return []
  if (dayEndHour <= dayStartHour) {
    throw new Error('dayEndHour must be greater than dayStartHour')
  }

  const totalMinutes = (dayEndHour - dayStartHour) * MINUTES_PER_HOUR
  const sorted = [...events].sort((a, b) => {
    const startDiff = a.start.getTime() - b.start.getTime()
    if (startDiff !== 0) return startDiff
    return b.end.getTime() - a.end.getTime()
  })

  const positioned: PositionedCalendarEvent<T>[] = []
  let group: T[] = []
  let groupMaxEnd = 0

  const processGroup = (items: T[]) => {
    if (items.length === 0) return

    const columns: T[][] = []

    for (const event of items) {
      const availableColumn = columns.find(column => {
        const lastEvent = column[column.length - 1]
        return !overlaps(event, lastEvent)
      })

      if (availableColumn) {
        availableColumn.push(event)
      } else {
        columns.push([event])
      }
    }

    const columnCount = columns.length

    columns.forEach((column, columnIndex) => {
      column.forEach(event => {
        let columnSpan = 1

        for (let nextColumnIndex = columnIndex + 1; nextColumnIndex < columnCount; nextColumnIndex += 1) {
          const hasCollision = columns[nextColumnIndex].some(otherEvent => overlaps(event, otherEvent))
          if (hasCollision) break
          columnSpan += 1
        }

        const startMinutes = Math.max(0, minutesFromDayStart(event.start, dayStartHour))
        const durationMinutes = Math.max(0, (event.end.getTime() - event.start.getTime()) / MS_PER_MINUTE)

        positioned.push({
          event,
          top: (startMinutes / totalMinutes) * 100,
          height: (durationMinutes / totalMinutes) * 100,
          left: (columnIndex / columnCount) * 100,
          width: (columnSpan / columnCount) * 100,
        })
      })
    })
  }

  for (const event of sorted) {
    const eventStart = event.start.getTime()

    if (group.length > 0 && eventStart >= groupMaxEnd) {
      processGroup(group)
      group = []
      groupMaxEnd = 0
    }

    group.push(event)
    groupMaxEnd = Math.max(groupMaxEnd, event.end.getTime())
  }

  processGroup(group)

  return positioned
}

export function clampEventToDay(event: CalendarLayoutEvent, day: Date): CalendarLayoutEvent {
  const start = new Date(day)
  start.setHours(0, 0, 0, 0)

  const end = new Date(day)
  end.setHours(23, 59, 59, 999)

  return {
    ...event,
    start: event.start < start ? start : event.start,
    end: event.end > end ? end : event.end,
  }
}
