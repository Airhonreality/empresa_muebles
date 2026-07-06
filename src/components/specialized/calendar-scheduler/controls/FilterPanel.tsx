import type { CalendarRecord, FeatureFlags, FilterState, TagRecord } from '../model/types'
import { ALL_FILTER_VALUE, EMPTY_FILTER_VALUE } from '../model/types'
import { LabeledSelect } from '../primitives/Fields'

export function FilterPanel({
  filters,
  statuses,
  tags,
  calendars,
  features,
  onChange,
}: {
  filters: FilterState
  statuses: string[]
  tags: TagRecord[]
  calendars: CalendarRecord[]
  features: FeatureFlags
  onChange: (filters: FilterState) => void
}) {
  return (
    <div className="grid gap-3 rounded-md border bg-card p-3 md:grid-cols-3">
      {features.calendars && (
        <LabeledSelect label="Calendar" value={filters.calendar_id} onChange={calendar_id => onChange({ ...filters, calendar_id })}>
          <option value={ALL_FILTER_VALUE}>All calendars</option>
          <option value={EMPTY_FILTER_VALUE}>Without calendar</option>
          {calendars.map(calendar => <option key={calendar.id} value={calendar.id}>{calendar.data.name}</option>)}
        </LabeledSelect>
      )}
      {features.tags && (
        <LabeledSelect label="Tag" value={filters.tag_id} onChange={tag_id => onChange({ ...filters, tag_id })}>
          <option value={ALL_FILTER_VALUE}>All tags</option>
          {tags.map(tag => <option key={tag.id} value={tag.id}>{tag.data.name}</option>)}
        </LabeledSelect>
      )}
      <LabeledSelect label="Status" value={filters.status} onChange={status => onChange({ ...filters, status })}>
        <option value={ALL_FILTER_VALUE}>All statuses</option>
        <option value={EMPTY_FILTER_VALUE}>Without status</option>
        {statuses.map(status => <option key={status} value={status}>{status}</option>)}
      </LabeledSelect>
    </div>
  )
}
