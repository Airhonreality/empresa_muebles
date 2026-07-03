import React from 'react'

export function LabeledInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  icon,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  icon?: React.ReactNode
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 flex items-center gap-1 font-medium">{icon}{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="h-10 w-full rounded-md border bg-card px-3 text-sm outline-none"
      />
    </label>
  )
}

export function LabeledSelect({
  label,
  value,
  children,
  onChange,
}: {
  label: string
  value: string
  children: React.ReactNode
  onChange: (value: string) => void
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-10 w-full rounded-md border bg-card px-3 text-sm outline-none"
      >
        {children}
      </select>
    </label>
  )
}

export function TextInput({ value, placeholder, onChange }: { value: string; placeholder?: string; onChange: (value: string) => void }) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={event => onChange(event.target.value)}
      className="h-10 min-w-0 flex-1 rounded-md border bg-card px-3 text-sm outline-none"
    />
  )
}
