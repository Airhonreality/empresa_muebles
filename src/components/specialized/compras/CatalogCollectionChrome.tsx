'use client';

import React from 'react';
import { Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type ChromeAction = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'outline';
  className?: string;
  disabled?: boolean;
};

type ChromeFilterOption = {
  value: string;
  label: string;
};

type CatalogCollectionChromeProps = {
  badges: React.ReactNode;
  actions?: ChromeAction[];
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  filterValue?: string;
  filterPlaceholder?: string;
  filterOptions?: ChromeFilterOption[];
  onFilterChange?: (value: string) => void;
  footer?: React.ReactNode;
};

export default function CatalogCollectionChrome({
  badges,
  actions = [],
  searchValue = '',
  searchPlaceholder = 'Buscar',
  onSearchChange,
  filterValue,
  filterPlaceholder,
  filterOptions,
  onFilterChange,
  footer,
}: CatalogCollectionChromeProps) {
  const hasSearch = typeof onSearchChange === 'function';
  const hasFilter = typeof onFilterChange === 'function' && Array.isArray(filterOptions);
  const hasControls = actions.length > 0 || hasSearch || hasFilter;

  return (
    <div className="space-y-4 px-4 pt-4 pb-3">
      <div className="flex flex-wrap items-center gap-2">{badges}</div>

      {hasControls ? (
        <div className="grid gap-3 xl:grid-cols-[auto_minmax(0,1fr)_220px_auto] xl:items-center">
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                type="button"
                variant={action.variant ?? 'outline'}
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  'gap-2 rounded-full',
                  action.variant === 'default'
                    ? 'bg-stone-950 text-white hover:bg-stone-800'
                    : 'border-stone-200 bg-stone-50',
                  action.className,
                )}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>

          {hasSearch ? (
            <div className="flex items-center gap-3 rounded-full border border-stone-200 bg-white px-4 py-3">
              <Search className="h-4 w-4 text-stone-500" />
              <Input
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
                placeholder={searchPlaceholder}
                className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              />
            </div>
          ) : (
            <div />
          )}

          {hasFilter ? (
            <Select value={filterValue} onValueChange={(value) => onFilterChange?.(value)}>
              <SelectTrigger className="h-11 rounded-full border-stone-200 bg-white">
                <SelectValue placeholder={filterPlaceholder || 'Filtro'} />
              </SelectTrigger>
              <SelectContent>
                {filterOptions?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div />
          )}

        </div>
      ) : null}

      {footer}
    </div>
  );
}
