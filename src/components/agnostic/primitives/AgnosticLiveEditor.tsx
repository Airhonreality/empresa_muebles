'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Props {
  value: any;
  onSave: (val: any) => void;
  type?: 'text' | 'number' | 'date';
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

/**
 * AgnosticLiveEditor v1.0
 * 
 * AXIOM: Double-click to transform a label into an input.
 * Purely agnostic: It doesn't know what it's editing, only how to switch states.
 */
export function AgnosticLiveEditor({ 
  value, 
  onSave, 
  type = 'text', 
  className = "", 
  labelClassName = "",
  inputClassName = ""
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onSave(type === 'number' ? parseFloat(localValue) || 0 : localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleBlur();
    if (e.key === 'Escape') {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`bg-white/10 border border-primary/30 rounded px-2 py-0.5 outline-none text-inherit font-inherit ${inputClassName}`}
      />
    );
  }

  return (
    <span 
      onDoubleClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-primary/5 rounded px-1 -mx-1 transition-colors group relative ${className}`}
    >
      <span className={labelClassName}>{value || '---'}</span>
      <span className="absolute -top-4 left-0 text-[6px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        Double Click to Edit
      </span>
    </span>
  );
}
