import React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CollapseStrip({ open, onToggle, label, icon: Icon, summary, children }: {
  open: boolean; onToggle: () => void
  label: string; icon: React.ElementType; summary?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="border-t border-stone-100">
      <button onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-2.5 text-xs hover:bg-stone-50/80 transition-colors">
        <div className="flex items-center gap-2 text-stone-400">
          <Icon size={12} className="text-amber-400" />
          <span className="uppercase tracking-widest font-semibold">{label}</span>
          {!open && summary}
        </div>
        {open ? <ChevronUp size={12} className="text-stone-300" /> : <ChevronDown size={12} className="text-stone-300" />}
      </button>
      <div className={cn('overflow-hidden transition-all duration-300', open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0')}>
        {children}
      </div>
    </div>
  )
}
