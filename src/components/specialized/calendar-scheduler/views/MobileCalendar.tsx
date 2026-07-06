import { Plus } from 'lucide-react'
import type { CalendarRecord, CalendarView, EventRecord, TagRecord } from '../model/types'
import { DAY_NAMES, sameDay, startOfDay } from '../model/date'
import { PrimaryButton } from '../primitives/Buttons'
import { AgendaList } from './AgendaList'

export function MobileCalendar({
  view,
  activeDate,
  monthDays,
  weekDays,
  events,
  eventsByDay,
  tags,
  calendars,
  onSelectDate,
  onCreate,
  onEdit,
}: {
  view: CalendarView
  activeDate: Date
  monthDays: Date[]
  weekDays: Date[]
  events: EventRecord[]
  eventsByDay: Map<string, EventRecord[]>
  tags: TagRecord[]
  calendars: CalendarRecord[]
  onSelectDate: (date: Date) => void
  onCreate: (date: Date) => void
  onEdit: (record: EventRecord) => void
}) {
  const pickerDays = view === 'month' ? monthDays : weekDays

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1">
        {pickerDays.map(day => {
          const key = startOfDay(day).toISOString()
          const count = eventsByDay.get(key)?.length ?? 0
          const selected = sameDay(day, activeDate)
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(day)}
              className={`min-h-12 rounded-md border text-center text-xs ${
                selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground'
              }`}
            >
              <span className="block">{DAY_NAMES[(day.getDay() + 6) % 7]}</span>
              <span className="block text-sm font-semibold">{day.getDate()}</span>
              {count > 0 && <span className={`mx-auto mt-1 block h-1.5 w-1.5 rounded-full ${selected ? 'bg-current' : 'bg-primary'}`} />}
            </button>
          )
        })}
      </div>

      <PrimaryButton onClick={() => onCreate(activeDate)}>
        <Plus size={16} />
        Event
      </PrimaryButton>

      <AgendaList
        events={events}
        tags={tags}
        calendars={calendars}
        emptyLabel={view === 'week' ? 'No events in this week.' : 'No events for the selected day.'}
        onEdit={onEdit}
      />
    </div>
  )
}
