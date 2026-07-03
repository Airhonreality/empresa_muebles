# Arbol De Schemas

Generated: 2026-07-02T13:04:34.032Z
Source: storage/db/schema_definitions.json

> Documento generado por `agno docs`. No es fuente canonica; la fuente canonica sigue en `storage/db/`.

## calendar_members

- calendar_id
- user_id
- role
- label

## event_calendars

- name
- description
- visibility
- color_token

## event_tags

- name
- slug
- color_token

## events

- title
- description
- start
- end
- timezone
- color
- status
- tag_ids
- calendar_id
- owner_id
- previous_start
- previous_end
- parent_event_id
- event_thread_id

## system_groups

- name
- label
- kind
- description
