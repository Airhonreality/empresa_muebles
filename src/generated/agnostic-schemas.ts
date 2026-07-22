// ============================================================
// AUTO-GENERATED — do not edit manually.
// Source: .\storage\db\schema_definitions.json
// Definition revision: legacy
// Run:    npm run agnostic:compile
// ============================================================

// DataItem is the universal record wrapper used by the engine.
// id: crypto.randomUUID() — never Math.random() or Date.now()
// context: matches schema.name and the data file name (without .json)
export interface AgnosticDataItem<T = Record<string, unknown>> {
  id: string
  context: string
  data: T
  created_at?: string
  updated_at?: string
}

// ─── Schema: "events" 
export interface Events {
  title?: string  // Title
  description?: string  // Description
  start?: string  // Start
  end?: string  // End
  timezone?: string  // Timezone
  color?: string  // Color
  status?: string  // Status
  tag_ids?: string  // Tag
  calendar_id?: string  // Calendar
  owner_id?: string  // Owner
  previous_start?: string  // Previous Start
  previous_end?: string  // Previous End
  parent_event_id?: string  // Parent Event Id
  event_thread_id?: string  // Event Thread Id
}

export type EventsRecord = AgnosticDataItem<Events>

// ─── Schema: "event_tags" 
export interface EventTags {
  name?: string  // Name
  slug?: string  // Slug
  color_token?: string  // Color Token
}

export type EventTagsRecord = AgnosticDataItem<EventTags>

// ─── Schema: "event_calendars" 
export interface EventCalendars {
  name?: string  // Name
  description?: string  // Description
  visibility?: string  // Visibility
  color_token?: string  // Color Token
}

export type EventCalendarsRecord = AgnosticDataItem<EventCalendars>

// ─── Schema: "calendar_members" 
export interface CalendarMembers {
  calendar_id?: string  // Calendar Id
  user_id?: string  // User Id
  role?: string  // Role
  label?: string  // Label
}

export type CalendarMembersRecord = AgnosticDataItem<CalendarMembers>

// ─── Schema: "system_groups" 
export interface SystemGroups {
  name?: string  // Name
  label?: string  // Label
  kind?: string  // Kind
  description?: string  // Description
}

export type SystemGroupsRecord = AgnosticDataItem<SystemGroups>

// ============================================================
// AgnosticSchemas — complete project schema map
//
// When generating custom components, import from here:
//   import type { Cliente, ClienteRecord } from '@/generated/agnostic-schemas'
//
// When setting block.context in page_routes.json, use SchemaName values.
// ============================================================
export interface AgnosticSchemas {
  events: Events
  event_tags: EventTags
  event_calendars: EventCalendars
  calendar_members: CalendarMembers
  system_groups: SystemGroups
}

// Valid values for block.context and fetch(`/api/vault?namespace=${ctx}`)
export type SchemaName = keyof AgnosticSchemas
// Resolved: 'events' | 'event_tags' | 'event_calendars' | 'calendar_members' | 'system_groups'
