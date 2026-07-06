import type { CSSProperties } from 'react'

export type CalendarView = 'month' | 'week' | 'day'
export type SchedulerMode = 'basic' | 'full'

export interface EventData {
  title: string
  description?: string
  start: string
  end: string
  timezone?: string
  status?: string
  tag_ids?: string
  calendar_id?: string
  owner_id?: string
  previous_start?: string
  previous_end?: string
  parent_event_id?: string
  event_thread_id?: string
  color?: string
  color_token?: string
}

export interface TaxonomyData {
  name: string
  slug?: string
  color_token?: string
}

export interface CalendarData {
  name: string
  description?: string
  visibility?: string
  color_token?: string
}

export interface MemberData {
  calendar_id?: string
  user_id?: string
  role?: string
  label?: string
}

export interface DataRecord<T> {
  id: string
  context?: string
  data: T
  updated_at?: string
}

export type EventRecord = DataRecord<EventData>
export type TagRecord = DataRecord<TaxonomyData>
export type CalendarRecord = DataRecord<CalendarData>
export type MemberRecord = DataRecord<MemberData>

export interface EventFormState {
  id?: string
  title: string
  description: string
  start: string
  end: string
  timezone: string
  status: string
  tag_ids: string[]
  calendar_id: string
  owner_id: string
}

export interface EventActionHandlers {
  onDelete: () => void
  onComplete: () => void
  onNotDone: () => void
  onPostpone: () => void
}

export interface FeatureFlags {
  tags: boolean
  calendars: boolean
  members: boolean
  filters: boolean
  admin: boolean
}

export interface FilterState {
  calendar_id: string
  tag_id: string
  status: string
}

export interface AdminDraft {
  tag_name: string
  calendar_name: string
  member_label: string
  member_role: string
  member_calendar_id: string
}

export interface SchedulerTheme {
  variables: CSSProperties
}

export const ALL_FILTER_VALUE = '__all__'
export const EMPTY_FILTER_VALUE = '__empty__'
