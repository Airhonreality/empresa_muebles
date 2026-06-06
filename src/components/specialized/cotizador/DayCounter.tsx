import React, { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function DayCounter({ label, value, onChange }: {
  label: string; value: number; onChange: (n: number) => void
}) {
  const v = Number(value) || 0
  const [str, setStr] = useState(String(v))

  useEffect(() => {
    setStr(String(v))
  }, [v])

  const commit = () => {
    const normalized = str.replace(',', '.')
    const parsed = parseFloat(normalized)
    onChange(Math.max(0, isNaN(parsed) ? v : parsed))
  }

  const dec = () => {
    onChange(Math.max(0, parseFloat((v - 0.5).toFixed(2))))
  }

  const inc = () => {
    onChange(parseFloat((v + 0.5).toFixed(2)))
  }

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
      <span className="text-[9px] uppercase tracking-widest text-stone-400 text-center leading-tight">{label}</span>
      <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <button type="button"
          onClick={dec}
          className="w-7 h-8 flex items-center justify-center text-stone-300 hover:bg-stone-50 hover:text-amber-600 transition-colors shrink-0">
          <ChevronDown size={12} />
        </button>
        <input type="text"
          value={str}
          onChange={e => setStr(e.target.value)}
          onBlur={commit}
          onKeyDown={e => e.key === 'Enter' && commit()}
          className="w-10 text-center text-sm font-semibold tabular-nums text-stone-700 focus:outline-none bg-transparent py-1"
        />
        <button type="button"
          onClick={inc}
          className="w-7 h-8 flex items-center justify-center text-stone-300 hover:bg-stone-50 hover:text-amber-600 transition-colors shrink-0">
          <ChevronUp size={12} />
        </button>
      </div>
    </div>
  )
}
