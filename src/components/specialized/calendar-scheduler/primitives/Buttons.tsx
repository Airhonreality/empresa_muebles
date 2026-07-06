import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-10 rounded-md border bg-card px-3 text-sm transition hover:opacity-80"
    >
      {children}
    </button>
  )
}

export function IconButton({ children, label, active, onClick }: { children: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`grid h-10 w-10 place-items-center rounded-md border bg-card transition hover:opacity-80 ${
        active ? 'border-primary text-primary' : 'border-border text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

export function IconPair({ onPrevious, onNext }: { onPrevious: () => void; onNext: () => void }) {
  return (
    <div className="flex h-10 overflow-hidden rounded-md border bg-card">
      <button type="button" className="grid w-10 place-items-center hover:opacity-70" onClick={onPrevious} aria-label="Previous">
        <ChevronLeft size={18} />
      </button>
      <button type="button" className="grid w-10 place-items-center hover:opacity-70" onClick={onNext} aria-label="Next">
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
