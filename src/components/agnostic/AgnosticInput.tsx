'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onSync: (val: string) => void;
  className?: string;
  ghost?: boolean;
}

/**
 * AgnosticInput: A Core Performance Primitive.
 * Handles local state for instant typing and syncs with the Core state only on blur.
 * This prevents global re-renders during active typing across the whole satellite.
 */
export function AgnosticInput({ value, onSync, className, ghost, ...props }: Props) {
  const [localValue, setLocalValue] = useState(value);

  // Sync local state when external value changes (external update)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = useCallback(() => {
    if (localValue !== value) {
      onSync(localValue);
    }
  }, [localValue, value, onSync]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  }, []);

  return (
    <Input
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={cn(
        "transition-all duration-200",
        ghost && "bg-transparent border-none focus:ring-0 focus:bg-muted/5",
        className
      )}
    />
  );
}
