# Arbol De Modulos

Generated: 2026-07-02T13:04:34.077Z
Source: src/components/specialized

> Documento generado por `agno docs`. No es fuente canonica; la fuente canonica sigue en `storage/db/`.

## src/components/specialized/CotizadorPro.tsx

- exports: CotizadorPro
- imports: @/lib/utils, @agnostic/core, lucide-react, react, sonner
- namespaces: cotizaciones, espacio_variantes, items_variante

## src/components/specialized/DataBrowser.tsx

- exports: DataBrowser, DataBrowserProps, FilterState, Schema, SchemaField, useRecordFilter
- imports: @/lib/utils, @agnostic/core, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, lucide-react, next/link, react
- namespaces: no_detectados

## src/components/specialized/PdfTemplateManager.tsx

- exports: PdfTemplateManager
- imports: @/lib/utils, lucide-react, react, sonner
- namespaces: pdf_templates

## src/components/specialized/_TEMPLATE.tsx

- exports: MyComponent
- imports: @/generated/agnostic-schemas, @agnostic/core, react
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/CalendarScheduler.tsx

- exports: CalendarScheduler
- imports: ./controls/AdminPanel, ./controls/FilterPanel, ./controls/ViewSwitcher, ./forms/EventDrawer, ./model/actions, ./model/config, ./model/date, ./model/filters, ./model/forms, ./model/persistence, ./model/theme, ./model/types, ./model/values, ./primitives/Buttons, ./views/MobileCalendar, ./views/MonthView, ./views/TimeGridView, @agnostic/core, lucide-react, react
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/controls/AdminPanel.tsx

- exports: AdminPanel
- imports: ../model/types, ../primitives/Buttons, ../primitives/Fields, ../primitives/TokenList, lucide-react, react
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/controls/FilterPanel.tsx

- exports: FilterPanel
- imports: ../model/types, ../primitives/Fields
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/controls/ViewSwitcher.tsx

- exports: ViewSwitcher
- imports: ../model/types
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/forms/EventDrawer.tsx

- exports: EventDrawer
- imports: ../model/types, ../primitives/Buttons, ../primitives/Fields, lucide-react
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/layout/calendar-layout.test.ts

- exports: no_detectados
- imports: ./calendar-layout, vitest
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/layout/calendar-layout.ts

- exports: CalendarLayoutEvent, PositionedCalendarEvent, clampEventToDay, computeCalendarLayout
- imports: no_detectados
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/model/actions.ts

- exports: no_detectados
- imports: ./date, ./persistence, ./types
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/model/config.ts

- exports: resolveSchedulerConfig
- imports: ./types
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/model/date.ts

- exports: DAY_NAMES, HOUR_MARKS, addDays, formatDayLabel, formatMonthLabel, formatTime, fromDatetimeLocalValue, getMonthDays, getWeekDays, sameDay, startOfDay, startOfMonth, startOfWeek, toDatetimeLocalValue
- imports: no_detectados
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/model/filters.ts

- exports: filterEvents, getStatuses, getVisibleEvents, groupEventsByDay
- imports: ./date, ./types, ./values
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/model/forms.ts

- exports: emptyEventForm, eventFormFromRecord
- imports: ./date, ./types, ./values
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/model/persistence.ts

- exports: normalizeEventRecords
- imports: ./types, @agnostic/core
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/model/theme.ts

- exports: eventStyle, schedulerTheme, tokenColor
- imports: ./types, ./values, react
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/model/types.ts

- exports: ALL_FILTER_VALUE, AdminDraft, CalendarData, CalendarRecord, CalendarView, DataRecord, EMPTY_FILTER_VALUE, EventActionHandlers, EventData, EventFormState, EventRecord, FeatureFlags, FilterState, MemberData, MemberRecord, SchedulerMode, SchedulerTheme, TagRecord, TaxonomyData
- imports: react
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/model/values.ts

- exports: joinIds, parseIds, slugify
- imports: no_detectados
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/primitives/Buttons.tsx

- exports: IconButton, IconPair, PrimaryButton, SecondaryButton
- imports: lucide-react, react
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/primitives/EventPill.tsx

- exports: EventPill
- imports: ../model/theme, ../model/types
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/primitives/Fields.tsx

- exports: LabeledInput, LabeledSelect, TextInput
- imports: react
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/primitives/TokenList.tsx

- exports: TokenList
- imports: no_detectados
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/views/AgendaList.tsx

- exports: AgendaList
- imports: ../model/date, ../model/theme, ../model/types, lucide-react
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/views/MobileCalendar.tsx

- exports: MobileCalendar
- imports: ../model/date, ../model/types, ../primitives/Buttons, ./AgendaList, lucide-react
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/views/MonthView.tsx

- exports: MonthView
- imports: ../model/date, ../model/types, ../primitives/EventPill
- namespaces: no_detectados

## src/components/specialized/calendar-scheduler/views/TimeGridView.tsx

- exports: TimeGridView
- imports: ../layout/calendar-layout, ../model/date, ../model/theme, ../model/types
- namespaces: no_detectados
