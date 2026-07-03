import type { CSSProperties } from 'react'
import type { CalendarRecord, EventRecord, TagRecord } from './types'
import { parseIds } from './values'

export const schedulerTheme: CSSProperties = {
  '--calendar-primary': 'var(--sat-accent)',
  '--calendar-primary-foreground': 'var(--sat-accent-fg)',
  '--calendar-surface': 'var(--sat-card)',
  '--calendar-subtle': 'var(--sat-muted)',
  '--calendar-border': 'var(--sat-border)',
  '--calendar-muted': 'var(--sat-muted-fg)',
  '--calendar-text': 'var(--sat-fg)',
  '--calendar-accent': 'var(--sat-muted)',
} as CSSProperties

const TOKEN_VARS: Record<string, string> = {
  primary: '--calendar-primary',
  accent: '--calendar-accent',
  muted: '--calendar-muted',
  surface: '--calendar-surface',
  border: '--calendar-border',
}

export function tokenColor(token?: string): string {
  const varName = TOKEN_VARS[token ?? 'primary'] ?? TOKEN_VARS.primary
  return `hsl(var(${varName}))`
}

export function eventStyle(record: EventRecord, calendars: CalendarRecord[], tags: TagRecord[]): CSSProperties {
  const eventTags = parseIds(record.data.tag_ids)
  const tagToken = tags.find(tag => eventTags.includes(tag.id) || eventTags.includes(tag.data.slug ?? ''))?.data.color_token
  const calendarToken = calendars.find(calendar => calendar.id === record.data.calendar_id)?.data.color_token
  const token = record.data.color_token ?? tagToken ?? calendarToken ?? 'primary'

  return {
    borderLeftColor: tokenColor(token),
    backgroundColor: 'hsl(var(--calendar-accent))',
    color: 'hsl(var(--calendar-text))',
  }
}
