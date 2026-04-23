"use client"

import { useId, useMemo, useState } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface SearchableMultiSelectProps {
  values: string[]
  onValuesChange: (values: string[]) => void
  options: string[]
  placeholder: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  id?: string
  className?: string
  maxSelected?: number
}

export function SearchableMultiSelect({
  values,
  onValuesChange,
  options,
  placeholder,
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled = false,
  id,
  className,
  maxSelected,
}: SearchableMultiSelectProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const normalizedQuery = query.trim().toLowerCase()
  const filteredOptions = useMemo(
    () =>
      normalizedQuery
        ? options.filter((option) =>
            option.toLowerCase().includes(normalizedQuery),
          )
        : options,
    [options, normalizedQuery],
  )

  const toggle = (option: string) => {
    if (values.includes(option)) {
      onValuesChange(values.filter((v) => v !== option))
      return
    }
    if (maxSelected && values.length >= maxSelected) return
    onValuesChange([...values, option])
  }

  const remove = (option: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onValuesChange(values.filter((v) => v !== option))
  }

  const capReached = maxSelected ? values.length >= maxSelected : false
  const triggerLabel =
    values.length === 0
      ? placeholder
      : `${values.length} selected${maxSelected ? ` / ${maxSelected}` : ""}`

  return (
    <div className="space-y-2">
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) setQuery("")
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={inputId}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${inputId}-listbox`}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              className,
            )}
          >
            <span
              className={cn(
                "truncate",
                values.length === 0 && "text-muted-foreground",
              )}
            >
              {triggerLabel}
            </span>
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
        >
          <div className="border-b p-2">
            <div className="relative">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && query) {
                    event.preventDefault()
                    event.stopPropagation()
                    if ("nativeEvent" in event) {
                      event.nativeEvent.stopImmediatePropagation()
                    }
                    setQuery("")
                  }
                }}
                placeholder={searchPlaceholder}
                autoFocus
                className="pr-8"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
            <div className="mt-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
              <span>
                {values.length}
                {maxSelected ? ` / ${maxSelected}` : ""} selected
              </span>
              <span>{filteredOptions.length} options</span>
            </div>
          </div>
          <div
            id={`${inputId}-listbox`}
            role="listbox"
            aria-multiselectable="true"
            className="max-h-64 overflow-y-auto p-1"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const selected = values.includes(option)
                const isDisabled = !selected && capReached
                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={isDisabled}
                    className={cn(
                      "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50",
                      selected && "bg-accent/60",
                    )}
                    onClick={() => toggle(option)}
                  >
                    <span className="truncate">{option}</span>
                    <Check
                      className={cn(
                        "size-4",
                        selected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </button>
                )
              })
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-md border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={(e) => remove(v, e)}
                className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
