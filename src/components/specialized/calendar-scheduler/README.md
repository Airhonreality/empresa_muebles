# CalendarScheduler

Specialized fork module for event scheduling. It is intentionally modular: the engine provides routing and persistence, while this artifact owns scheduler behavior.

## Minimal Usage

Register in `agnostic.config.ts`:

```ts
calendar_scheduler: () => import('./src/components/specialized/calendar-scheduler/CalendarScheduler')
```

Use in `page_routes.json`:

```json
{ "type": "calendar_scheduler", "context": "events" }
```

## Modes

Basic mode needs only `events`:

```json
{
  "type": "calendar_scheduler",
  "context": "events",
  "config": { "mode": "basic" }
}
```

Full mode enables optional tags, calendars, members, filters, and admin tools:

```json
{
  "type": "calendar_scheduler",
  "context": "events",
  "config": {
    "mode": "full",
    "features": {
      "tags": true,
      "calendars": true,
      "members": true,
      "filters": true,
      "admin": true
    }
  }
}
```

## Storage Contract

Required:

```text
events:
  title
  description
  start
  end
  timezone
```

Optional:

```text
events:
  status
  tag_ids
  calendar_id
  owner_id
  previous_start
  previous_end
  parent_event_id
  event_thread_id

event_tags:
  name
  slug
  color_token

event_calendars:
  name
  description
  visibility
  color_token

calendar_members:
  calendar_id
  user_id
  role
  label
```

## Event Actions

When editing an existing event, the drawer exposes four lifecycle actions:

- `Delete`: removes the current record.
- `Completado`: persists the event with `status = completed`.
- `No realizado`: persists the event with `status = not_done`.
- `Post poner`: creates a new event shifted by one day and stores the old schedule in `previous_start` and `previous_end`, linked by `parent_event_id` and `event_thread_id`.

These fields stay inside the `events` namespace so the fork can keep the scheduler lightweight while preserving traceability across reschedules.

## Module Layout

```text
CalendarScheduler.tsx       orchestrator
model/                      types, date, filters, config, persistence, theme
layout/                     collision layout algorithm
views/                      month, time grid, mobile, agenda
controls/                   toolbar view switcher, filters, admin
forms/                      event drawer
primitives/                 local UI primitives with scheduler tokens
```

## Design Rule

Do not add business rules to the engine for this scheduler. Add feature behavior here, keep it optional, and let storage namespaces decide what a fork activates.
