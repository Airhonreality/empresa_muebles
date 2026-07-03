import { describe, expect, it } from 'vitest'
import { computeCalendarLayout } from './calendar-layout'

function event(id: string, start: string, end: string) {
  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)

  return {
    id,
    start: new Date(2026, 5, 30, startHour, startMinute),
    end: new Date(2026, 5, 30, endHour, endMinute),
  }
}

describe('computeCalendarLayout', () => {
  it('keeps contiguous events in the same full-width column', () => {
    const result = computeCalendarLayout([
      event('a', '09:00', '10:00'),
      event('b', '10:00', '11:00'),
    ])

    expect(result).toHaveLength(2)
    expect(result.map(item => item.left)).toEqual([0, 0])
    expect(result.map(item => item.width)).toEqual([100, 100])
  })

  it('splits fully overlapping events into parallel columns', () => {
    const result = computeCalendarLayout([
      event('a', '09:00', '11:00'),
      event('b', '09:30', '10:30'),
    ])

    const byId = new Map(result.map(item => [item.event.id, item]))

    expect(byId.get('a')?.left).toBe(0)
    expect(byId.get('a')?.width).toBe(50)
    expect(byId.get('b')?.left).toBe(50)
    expect(byId.get('b')?.width).toBe(50)
  })

  it('expands events across free columns inside the same collision group', () => {
    const result = computeCalendarLayout([
      event('a', '09:00', '12:00'),
      event('b', '09:30', '10:00'),
      event('c', '10:00', '11:00'),
    ])

    const byId = new Map(result.map(item => [item.event.id, item]))

    expect(byId.get('a')?.width).toBeCloseTo(50)
    expect(byId.get('b')?.width).toBeCloseTo(50)
    expect(byId.get('c')?.width).toBeCloseTo(50)
  })

  it('maps vertical placement as a percentage of the visible day', () => {
    const [result] = computeCalendarLayout([event('a', '09:00', '10:30')], 8, 18)

    expect(result.top).toBeCloseTo(10)
    expect(result.height).toBeCloseTo(15)
  })
})
