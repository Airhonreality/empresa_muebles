'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import type { BlockProps } from '@agnostic/core'
import { Filter, Plus, Settings2 } from 'lucide-react'
import { AdminPanel } from './controls/AdminPanel'
import { FilterPanel } from './controls/FilterPanel'
import { ViewSwitcher } from './controls/ViewSwitcher'
import { EventDrawer } from './forms/EventDrawer'
import { postponeEvent, updateEventStatus } from './model/actions'
import { resolveSchedulerConfig } from './model/config'
import { formatMonthLabel, fromDatetimeLocalValue, getMonthDays, getWeekDays, startOfDay, addDays, sameDay } from './model/date'
import { emptyEventForm, eventFormFromRecord } from './model/forms'
import { filterEvents, getStatuses, getVisibleEvents, groupEventsByDay } from './model/filters'
import { normalizeEventRecords, readNamespace, removeRecord, writeRecord } from './model/persistence'
import { schedulerTheme } from './model/theme'
import type {
  AdminDraft,
  CalendarData,
  CalendarRecord,
  CalendarView,
  EventData,
  EventRecord,
  FilterState,
  MemberData,
  MemberRecord,
  TagRecord,
  TaxonomyData,
} from './model/types'
import { ALL_FILTER_VALUE } from './model/types'
import { joinIds, slugify } from './model/values'
import { IconButton, IconPair, PrimaryButton, SecondaryButton } from './primitives/Buttons'
import { MobileCalendar } from './views/MobileCalendar'
import { MonthView } from './views/MonthView'
import { TimeGridView } from './views/TimeGridView'

/**
 * CalendarScheduler is a fork-level specialized block.
 *
 * Minimal use:
 *   { "type": "calendar_scheduler", "context": "events" }
 *
 * Basic mode:
 *   { "type": "calendar_scheduler", "context": "events", "config": { "mode": "basic" } }
 *
 * Full mode:
 *   { "type": "calendar_scheduler", "context": "events", "config": {
 *     "mode": "full",
 *     "features": { "tags": true, "calendars": true, "members": true, "filters": true, "admin": true }
 *   } }
 *
 * Required namespace:
 *   events: title, description, start, end, timezone
 *
 * Optional namespaces:
 *   event_tags, event_calendars, calendar_members
 */
export default function CalendarScheduler(props: BlockProps) {
  const block = (props.block ?? props) as Record<string, unknown>
  const context = String(block.context ?? props.context ?? 'events')
  const { mode, features } = resolveSchedulerConfig(block)

  const [records, setRecords] = useState<EventRecord[]>(() => normalizeEventRecords(props.records))
  const [tags, setTags] = useState<TagRecord[]>([])
  const [calendars, setCalendars] = useState<CalendarRecord[]>([])
  const [members, setMembers] = useState<MemberRecord[]>([])
  const [loading, setLoading] = useState(!props.records?.length)
  const [error, setError] = useState<string | null>(null)
  const [activeDate, setActiveDate] = useState(() => startOfDay(new Date()))
  const [view, setView] = useState<CalendarView>('week')
  const [form, setForm] = useState<ReturnType<typeof emptyEventForm> | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({ calendar_id: ALL_FILTER_VALUE, tag_id: ALL_FILTER_VALUE, status: ALL_FILTER_VALUE })
  const [adminDraft, setAdminDraft] = useState<AdminDraft>({
    tag_name: '',
    calendar_name: '',
    member_label: '',
    member_role: 'viewer',
    member_calendar_id: '',
  })

  const refreshData = useCallback(async () => {
    try {
      setLoading(true)
      const [eventRecords, tagRecords, calendarRecords, memberRecords] = await Promise.all([
        readNamespace<EventData>(context),
        features.tags ? readNamespace<TaxonomyData>('event_tags') : Promise.resolve([]),
        features.calendars ? readNamespace<CalendarData>('event_calendars') : Promise.resolve([]),
        features.members ? readNamespace<MemberData>('calendar_members') : Promise.resolve([]),
      ])

      setRecords(eventRecords)
      setTags(tagRecords)
      setCalendars(calendarRecords)
      setMembers(memberRecords)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load calendar data')
    } finally {
      setLoading(false)
    }
  }, [context, features.calendars, features.members, features.tags])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const sortedEvents = useMemo(() => {
    return [...records].sort((a, b) => new Date(a.data.start).getTime() - new Date(b.data.start).getTime())
  }, [records])

  const filteredEvents = useMemo(() => filterEvents(sortedEvents, filters), [filters, sortedEvents])
  const statuses = useMemo(() => getStatuses(sortedEvents), [sortedEvents])
  const monthDays = useMemo(() => getMonthDays(activeDate), [activeDate])
  const weekDays = useMemo(() => getWeekDays(activeDate), [activeDate])
  const visibleEvents = useMemo(() => getVisibleEvents({ events: filteredEvents, view, activeDate, monthDays, weekDays }), [activeDate, filteredEvents, monthDays, view, weekDays])
  const mobileEvents = useMemo(() => {
    if (view === 'week') return visibleEvents
    return visibleEvents.filter(record => sameDay(new Date(record.data.start), activeDate))
  }, [activeDate, view, visibleEvents])
  const eventsByDay = useMemo(() => groupEventsByDay(visibleEvents), [visibleEvents])
  const activeRecord = useMemo(() => {
    if (!form?.id) return null
    return records.find(record => record.id === form.id) ?? null
  }, [form?.id, records])

  const openNewForm = (date = activeDate) => setForm(emptyEventForm(date))
  const openEditForm = (record: EventRecord) => setForm(eventFormFromRecord(record))

  const saveEvent = async () => {
    if (!form) return
    const startIso = fromDatetimeLocalValue(form.start)
    const endIso = fromDatetimeLocalValue(form.end)

    if (!form.title.trim()) {
      setError('Title is required')
      return
    }

    if (new Date(startIso) >= new Date(endIso)) {
      setError('End must be after start')
      return
    }

    try {
      await writeRecord<EventData>(context, form.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        start: startIso,
        end: endIso,
        timezone: form.timezone.trim() || 'UTC',
        status: form.status.trim(),
        tag_ids: joinIds(form.tag_ids),
        calendar_id: form.calendar_id,
        owner_id: form.owner_id.trim(),
      })
      setForm(null)
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save event')
    }
  }

  const deleteEvent = async () => {
    if (!form?.id) return
    try {
      await removeRecord(context, form.id)
      setForm(null)
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete event')
    }
  }

  const updateCurrentStatus = async (status: string) => {
    if (!form?.id || !activeRecord) return
    try {
      await updateEventStatus(context, activeRecord, status)
      setForm(null)
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update event')
    }
  }

  const completeEvent = () => updateCurrentStatus('completed')
  const markNotDone = () => updateCurrentStatus('not_done')

  const postponeCurrent = async () => {
    if (!form?.id || !activeRecord) return
    try {
      await postponeEvent(context, activeRecord)
      setForm(null)
      await refreshData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not postpone event')
    }
  }

  const saveTag = async () => {
    if (!adminDraft.tag_name.trim()) return
    await writeRecord<TaxonomyData>('event_tags', undefined, {
      name: adminDraft.tag_name.trim(),
      slug: slugify(adminDraft.tag_name),
      color_token: 'primary',
    })
    setAdminDraft(draft => ({ ...draft, tag_name: '' }))
    await refreshData()
  }

  const saveCalendar = async () => {
    if (!adminDraft.calendar_name.trim()) return
    await writeRecord<CalendarData>('event_calendars', undefined, {
      name: adminDraft.calendar_name.trim(),
      description: '',
      visibility: 'shared',
      color_token: 'primary',
    })
    setAdminDraft(draft => ({ ...draft, calendar_name: '' }))
    await refreshData()
  }

  const saveMember = async () => {
    if (!adminDraft.member_label.trim() || !adminDraft.member_calendar_id) return
    await writeRecord<MemberData>('calendar_members', undefined, {
      calendar_id: adminDraft.member_calendar_id,
      user_id: slugify(adminDraft.member_label),
      role: adminDraft.member_role.trim() || 'viewer',
      label: adminDraft.member_label.trim(),
    })
    setAdminDraft(draft => ({ ...draft, member_label: '' }))
    await refreshData()
  }

  const moveWindow = (direction: -1 | 1) => {
    if (view === 'month') {
      const next = new Date(activeDate)
      next.setMonth(next.getMonth() + direction)
      setActiveDate(startOfDay(next))
      return
    }

    setActiveDate(startOfDay(addDays(activeDate, direction * (view === 'week' ? 7 : 1))))
  }

  return (
    <section className="min-h-screen bg-[hsl(var(--calendar-subtle))] text-[hsl(var(--calendar-text))]" style={schedulerTheme}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-normal">Calendar Scheduler</h1>
            <p className="text-sm text-muted-foreground">
              {formatMonthLabel(activeDate)} · {mode}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ViewSwitcher view={view} onChange={setView} />
            <IconPair onPrevious={() => moveWindow(-1)} onNext={() => moveWindow(1)} />
            <SecondaryButton onClick={() => setActiveDate(startOfDay(new Date()))}>Today</SecondaryButton>
            {features.filters && (
              <IconButton active={filtersOpen} label="Filters" onClick={() => setFiltersOpen(value => !value)}>
                <Filter size={16} />
              </IconButton>
            )}
            {features.admin && (
              <IconButton active={adminOpen} label="Admin" onClick={() => setAdminOpen(value => !value)}>
                <Settings2 size={16} />
              </IconButton>
            )}
            <PrimaryButton onClick={() => openNewForm()}>
              <Plus size={16} />
              Event
            </PrimaryButton>
          </div>
        </header>

        {error && (
          <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {features.filters && filtersOpen && (
          <FilterPanel filters={filters} statuses={statuses} tags={tags} calendars={calendars} features={features} onChange={setFilters} />
        )}

        {features.admin && adminOpen && (
          <AdminPanel
            draft={adminDraft}
            tags={tags}
            calendars={calendars}
            members={members}
            features={features}
            onChange={setAdminDraft}
            onSaveTag={saveTag}
            onSaveCalendar={saveCalendar}
            onSaveMember={saveMember}
          />
        )}

        {loading ? (
          <div className="grid min-h-80 place-items-center text-sm text-muted-foreground">Loading events...</div>
        ) : (
          <>
            <div className="lg:hidden">
              <MobileCalendar
                view={view}
                activeDate={activeDate}
                monthDays={monthDays}
                weekDays={weekDays}
                events={mobileEvents}
                eventsByDay={eventsByDay}
                tags={tags}
                calendars={calendars}
                onSelectDate={setActiveDate}
                onCreate={openNewForm}
                onEdit={openEditForm}
              />
            </div>

            <div className="hidden lg:block">
              {view === 'month' ? (
                <MonthView
                  activeDate={activeDate}
                  days={monthDays}
                  eventsByDay={eventsByDay}
                  tags={tags}
                  calendars={calendars}
                  onSelectDate={setActiveDate}
                  onCreate={openNewForm}
                  onEdit={openEditForm}
                />
              ) : (
                <TimeGridView
                  days={view === 'week' ? weekDays : [activeDate]}
                  eventsByDay={eventsByDay}
                  tags={tags}
                  calendars={calendars}
                  onCreate={openNewForm}
                  onEdit={openEditForm}
                />
              )}
            </div>
          </>
        )}
      </div>

      {form && (
        <EventDrawer
          form={form}
          record={activeRecord}
          tags={tags}
          calendars={calendars}
          features={features}
          onChange={setForm}
          onClose={() => setForm(null)}
          onSave={saveEvent}
          onDelete={form.id ? deleteEvent : undefined}
          onComplete={form.id ? completeEvent : undefined}
          onNotDone={form.id ? markNotDone : undefined}
          onPostpone={form.id ? postponeCurrent : undefined}
        />
      )}
    </section>
  )
}
