import React from 'react'
import { Layers, Plus, Tag, Users } from 'lucide-react'
import type { AdminDraft, CalendarRecord, FeatureFlags, MemberRecord, TagRecord } from '../model/types'
import { PrimaryButton } from '../primitives/Buttons'
import { LabeledSelect, TextInput } from '../primitives/Fields'
import { TokenList } from '../primitives/TokenList'

export function AdminPanel({
  draft,
  tags,
  calendars,
  members,
  features,
  onChange,
  onSaveTag,
  onSaveCalendar,
  onSaveMember,
}: {
  draft: AdminDraft
  tags: TagRecord[]
  calendars: CalendarRecord[]
  members: MemberRecord[]
  features: FeatureFlags
  onChange: (draft: AdminDraft) => void
  onSaveTag: () => void
  onSaveCalendar: () => void
  onSaveMember: () => void
}) {
  return (
    <div className="grid gap-3 rounded-md border bg-card p-3 lg:grid-cols-3">
      {features.tags && (
        <AdminSection icon={<Tag size={16} />} title="Tags">
          <div className="flex gap-2">
            <TextInput value={draft.tag_name} placeholder="pending, done..." onChange={tag_name => onChange({ ...draft, tag_name })} />
            <PrimaryButton onClick={onSaveTag}><Plus size={16} /></PrimaryButton>
          </div>
          <TokenList items={tags.map(tag => tag.data.name)} />
        </AdminSection>
      )}

      {features.calendars && (
        <AdminSection icon={<Layers size={16} />} title="Calendars">
          <div className="flex gap-2">
            <TextInput value={draft.calendar_name} placeholder="Shared roadmap" onChange={calendar_name => onChange({ ...draft, calendar_name })} />
            <PrimaryButton onClick={onSaveCalendar}><Plus size={16} /></PrimaryButton>
          </div>
          <TokenList items={calendars.map(calendar => calendar.data.name)} />
        </AdminSection>
      )}

      {features.members && (
        <AdminSection icon={<Users size={16} />} title="Members">
          <LabeledSelect label="Calendar" value={draft.member_calendar_id} onChange={member_calendar_id => onChange({ ...draft, member_calendar_id })}>
            <option value="">Select calendar</option>
            {calendars.map(calendar => <option key={calendar.id} value={calendar.id}>{calendar.data.name}</option>)}
          </LabeledSelect>
          <div className="mt-2 grid grid-cols-[1fr_88px_auto] gap-2">
            <TextInput value={draft.member_label} placeholder="User label" onChange={member_label => onChange({ ...draft, member_label })} />
            <TextInput value={draft.member_role} placeholder="role" onChange={member_role => onChange({ ...draft, member_role })} />
            <PrimaryButton onClick={onSaveMember}><Plus size={16} /></PrimaryButton>
          </div>
          <TokenList items={members.map(member => `${member.data.label ?? member.data.user_id} · ${member.data.role ?? 'viewer'}`)} />
        </AdminSection>
      )}
    </div>
  )
}

function AdminSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border p-3">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">{icon}{title}</h2>
      {children}
    </section>
  )
}
