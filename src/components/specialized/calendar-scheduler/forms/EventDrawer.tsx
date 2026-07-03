import { Check, Clock, Save, Trash2, X } from 'lucide-react'
import type { CalendarRecord, EventFormState, EventRecord, FeatureFlags, TagRecord } from '../model/types'
import { PrimaryButton } from '../primitives/Buttons'
import { LabeledInput, LabeledSelect } from '../primitives/Fields'

export function EventDrawer({
  form,
  record,
  tags,
  calendars,
  features,
  onChange,
  onClose,
  onSave,
  onDelete,
  onComplete,
  onNotDone,
  onPostpone,
}: {
  form: EventFormState
  record?: EventRecord | null
  tags: TagRecord[]
  calendars: CalendarRecord[]
  features: FeatureFlags
  onChange: (form: EventFormState) => void
  onClose: () => void
  onSave: () => void
  onDelete?: () => void
  onComplete?: () => void
  onNotDone?: () => void
  onPostpone?: () => void
}) {
  const update = (patch: Partial<EventFormState>) => onChange({ ...form, ...patch })

  const toggleTag = (tagId: string) => {
    update({
      tag_ids: form.tag_ids.includes(tagId)
        ? form.tag_ids.filter(id => id !== tagId)
        : [...form.tag_ids, tagId],
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30">
      <aside className="h-full w-full max-w-md overflow-y-auto bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-base font-semibold">{form.id ? 'Edit event' : 'New event'}</h2>
            <p className="text-xs text-muted-foreground">ISO UTC storage with optional scheduler metadata.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-md hover:opacity-70" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <LabeledInput label="Title" value={form.title} onChange={title => update({ title })} />
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Description</span>
            <textarea
              value={form.description}
              onChange={event => update({ description: event.target.value })}
              className="min-h-24 w-full rounded-md border bg-card px-3 py-2 text-sm outline-none"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput icon={<Clock size={14} />} label="Start" type="datetime-local" value={form.start} onChange={start => update({ start })} />
            <LabeledInput icon={<Clock size={14} />} label="End" type="datetime-local" value={form.end} onChange={end => update({ end })} />
          </div>

          <LabeledInput label="Timezone" value={form.timezone} onChange={timezone => update({ timezone })} />
          <LabeledInput label="Status" value={form.status} placeholder="pending, done, blocked..." onChange={status => update({ status })} />

          {features.calendars && (
            <LabeledSelect label="Calendar" value={form.calendar_id} onChange={calendar_id => update({ calendar_id })}>
              <option value="">No calendar</option>
              {calendars.map(calendar => <option key={calendar.id} value={calendar.id}>{calendar.data.name}</option>)}
            </LabeledSelect>
          )}

          {features.tags && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Tags</legend>
              {tags.length === 0 ? (
                <p className="text-xs text-muted-foreground">Create tags from the admin panel.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-md border px-2 py-1 text-xs ${
                      form.tag_ids.includes(tag.id)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card text-foreground'
                    }`}
                  >
                    {tag.data.name}
                  </button>
                  ))}
                </div>
              )}
            </fieldset>
          )}

          {features.members && <LabeledInput label="Owner" value={form.owner_id} placeholder="Optional user id" onChange={owner_id => update({ owner_id })} />}
        </div>

        <div className="sticky bottom-0 border-t bg-card p-4">
          {record && (onDelete || onComplete || onNotDone || onPostpone) ? (
            <div className="grid grid-cols-2 gap-2">
              {onDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-foreground transition hover:opacity-80"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              ) : <span />}
              {onComplete ? (
                <button
                  type="button"
                  onClick={onComplete}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-muted/20 px-3 text-sm text-foreground transition hover:opacity-80"
                >
                  <Check size={16} />
                  Completado
                </button>
              ) : <span />}
              {onNotDone ? (
                <button
                  type="button"
                  onClick={onNotDone}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-foreground transition hover:opacity-80"
                >
                  <X size={16} />
                  No realizado
                </button>
              ) : <span />}
              {onPostpone ? (
                <button
                  type="button"
                  onClick={onPostpone}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-foreground transition hover:opacity-80"
                >
                  <Clock size={16} />
                  Post poner
                </button>
              ) : <span />}
            </div>
          ) : null}
          <div className="mt-3 flex items-center justify-end">
            <PrimaryButton onClick={onSave}>
              <Save size={16} />
              Save
            </PrimaryButton>
          </div>
        </div>
      </aside>
    </div>
  )
}
