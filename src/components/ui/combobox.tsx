"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  onCreateOption?: (inputValue: string) => void
  createLabel?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Seleccionar opción...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  disabled = false,
  className,
  onCreateOption,
  createLabel = "Crear",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedOption = options.find((opt) => opt.value === value)

  const showCreateOption =
    onCreateOption &&
    search.trim() !== "" &&
    !options.some(
      (opt) => opt.label.toLowerCase() === search.trim().toLowerCase()
    )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal text-xs h-9 px-3", className)}
        >
          {selectedOption ? selectedOption.label : <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-50">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
            className="h-9 text-xs"
          />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-xs text-muted-foreground">
              {emptyMessage}
            </CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => {
                    onValueChange(opt.value)
                    setOpen(false)
                    setSearch("")
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      value === opt.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
            
            {showCreateOption && (
              <>
                <div className="h-px bg-border my-1" />
                <CommandGroup>
                  <CommandItem
                    value={search}
                    onSelect={() => {
                      onCreateOption!(search.trim())
                      setOpen(false)
                      setSearch("")
                    }}
                    className="text-xs text-primary font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>
                      {createLabel} &quot;{search}&quot;
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
