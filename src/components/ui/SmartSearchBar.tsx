'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Clock, Trash2, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { SmartSearchResult, SearchableItem } from '@/hooks/useSmartSearch'

interface SmartSearchBarProps<T extends SearchableItem> {
  query: string
  onQueryChange: (q: string) => void
  results: {
    matches: SmartSearchResult<T>[]
    recentlyUsed: SmartSearchResult<T>[]
    suggestions: string[]
  }
  onSelect: (item: T) => void
  onHistoryClick?: (query: string) => void
  onClearHistory?: () => void
  history: Array<{ query: string; timestamp: number }>
  renderItem?: (item: T, type: 'recent' | 'frequent' | 'match') => React.ReactNode
  placeholder?: string
  contextLabel?: string
}

export function SmartSearchBar<T extends SearchableItem>({
  query,
  onQueryChange,
  results,
  onSelect,
  onHistoryClick,
  onClearHistory,
  history,
  renderItem,
  placeholder = 'Buscar...',
  contextLabel = 'Búsqueda',
}: SmartSearchBarProps<T>) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (query && !open) {
      setOpen(true)
    }
  }, [query])

  const handleSelectSuggestion = (suggestion: string) => {
    onQueryChange(suggestion)
  }

  const handleSelectItem = (item: T) => {
    onSelect(item)
    setOpen(false)
    onQueryChange('')
  }

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClearHistory?.()
  }

  const isEmpty =
    results.matches.length === 0 &&
    results.recentlyUsed.length === 0 &&
    results.suggestions.length === 0 &&
    history.length === 0

  return (
    <div className="w-full" ref={triggerRef}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={placeholder}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setOpen(true)}
              className="pl-9 pr-3"
            />
          </div>
        </PopoverTrigger>

      <PopoverContent
        className="p-0 w-screen sm:w-auto"
        align="start"
        side="bottom"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList className="max-h-96 overflow-y-auto">
            {/* Sugerencias de búsquedas previas */}
            {query.length === 0 && results.suggestions.length > 0 && (
              <CommandGroup heading={<span className="text-xs font-semibold">Búsquedas sugeridas</span>}>
                {results.suggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion}
                    value={suggestion}
                    onSelect={() => handleSelectSuggestion(suggestion)}
                    className="cursor-pointer"
                  >
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{suggestion}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Items usados recientemente */}
            {query.length === 0 && results.recentlyUsed.length > 0 && (
              <CommandGroup heading={<span className="text-xs font-semibold">Usado recientemente</span>}>
                {results.recentlyUsed.map((result) => (
                  <CommandItem
                    key={result.item.id}
                    value={result.item.id}
                    onSelect={() => handleSelectItem(result.item)}
                    className="cursor-pointer"
                  >
                    <TrendingUp className="mr-2 h-4 w-4 text-amber-500" />
                    {renderItem ? (
                      renderItem(result.item, 'recent')
                    ) : (
                      <span>{result.item.nombre_proyecto || result.item.nombre || result.item.id}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Resultados de búsqueda */}
            {results.matches.length > 0 && (
              <CommandGroup heading={<span className="text-xs font-semibold">Resultados</span>}>
                {results.matches.map((result) => (
                  <CommandItem
                    key={result.item.id}
                    value={result.item.id}
                    onSelect={() => handleSelectItem(result.item)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      {renderItem ? (
                        renderItem(result.item, result.type)
                      ) : (
                        <span>{result.item.nombre_proyecto || result.item.nombre || result.item.id}</span>
                      )}
                      {result.relevance > 0.8 && (
                        <Badge variant="secondary" className="ml-auto h-5 text-xs">
                          {Math.round(result.relevance * 100)}%
                        </Badge>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Histórico de búsquedas */}
            {query.length === 0 && history.length > 0 && isEmpty && (
              <CommandGroup heading={<span className="text-xs font-semibold">Histórico</span>}>
                {history.map((entry) => (
                  <CommandItem
                    key={`${entry.query}-${entry.timestamp}`}
                    value={entry.query}
                    onSelect={() => onHistoryClick?.(entry.query)}
                    className="cursor-pointer"
                  >
                    <Clock className="mr-2 h-4 w-4 text-gray-400" />
                    <span className="flex-1">{entry.query}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </CommandItem>
                ))}
                {history.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleClearHistory}
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Limpiar histórico
                  </Button>
                )}
              </CommandGroup>
            )}

            {isEmpty && query.length > 0 && (
              <CommandEmpty>
                <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                  <Search className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    No se encontraron resultados para "{query}"
                  </p>
                </div>
              </CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
      </Popover>
    </div>
  )
}
