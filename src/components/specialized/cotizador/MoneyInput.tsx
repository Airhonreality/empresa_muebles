import React, { useEffect, useState } from 'react'
import { COP } from './utils'

export function MoneyInput({ label, value, onChange }: {
  label?: string; value: number | undefined; onChange: (n: number) => void
}) {
  const [isFocused, setIsFocused] = useState(false)
  const [localVal, setLocalVal] = useState('')

  useEffect(() => {
    if (!isFocused) {
      setLocalVal(value !== undefined && value !== 0 ? COP(value) : '')
    }
  }, [value, isFocused])

  const handleBlur = () => {
    setIsFocused(false)
    const n = parseFloat(localVal.replace(/[^0-9.-]/g, '')) || 0
    onChange(n)
  }

  const handleFocus = () => {
    setIsFocused(true)
    setLocalVal(value !== undefined && value !== 0 ? String(value) : '')
  }

  return (
    <div className="flex flex-col gap-1 min-w-[100px]">
      {label && <span className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">{label}</span>}
      <input
        type="text"
        value={localVal}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={e => setLocalVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.currentTarget.blur()
          }
        }}
        placeholder="$ 0"
        className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-300 bg-white tabular-nums text-stone-700 font-medium"
      />
    </div>
  )
}
