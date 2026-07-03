import type { CalendarView } from '../model/types'

export function ViewSwitcher({ view, onChange }: { view: CalendarView; onChange: (view: CalendarView) => void }) {
  return (
    <div className="flex h-10 overflow-hidden rounded-md border bg-card">
      {(['month', 'week', 'day'] as CalendarView[]).map(option => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`px-3 text-sm capitalize transition ${
            view === option ? 'bg-primary text-primary-foreground' : 'text-foreground'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
