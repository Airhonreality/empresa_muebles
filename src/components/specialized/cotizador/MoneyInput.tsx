import React, { useEffect, useState } from 'react'

export function MoneyInput({ label, value, onChange }: {
  label?: string; value: number | undefined; onChange: (n: number) => void
}) {
  const [str, setStr] = useState(value ? String(value) : '')
  useEffect(() => { setStr(value ? String(value) : '') }, [value])
  const commit = () => {
    const n = parseFloat(str.replace(/[^0-9.-]/g, '')) || 0
    onChange(n)
  }
  return (
    <div className="flex flex-col gap-1 min-w-[100px]">
      {label && <span className="text-[9px] uppercase tracking-widest text-stone-400">{label}</span>}
      <input type="text" value={str}
        onChange={e => setStr(e.target.value)} onBlur={commit}
        onKeyDown={e => e.key === 'Enter' && commit()}
        placeholder="0"
        className="w-full px-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-300 bg-white tabular-nums text-stone-700"
      />
    </div>
  )
}
