"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type CalendarProps = {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
  captionLayout?: "label" | "dropdown" | "dropdown-buttons";
  disabled?: (date: Date) => boolean;
  fromDate?: Date;
  toDate?: Date;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function addMonths(d: Date, n: number) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }

export function Calendar({ mode = "single", selected, onSelect, className, captionLayout = "label", disabled, fromDate, toDate }: CalendarProps) {
  const [cursor, setCursor] = React.useState<Date>(() => selected ? startOfMonth(selected) : startOfMonth(new Date()));
  React.useEffect(() => { if (selected) setCursor(startOfMonth(selected)); }, [selected]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = startOfMonth(cursor);
  const last = endOfMonth(cursor);
  const startDay = first.getDay();
  const daysInMonth = last.getDate();

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const selectedTime = selected ? new Date(selected.getFullYear(), selected.getMonth(), selected.getDate()).getTime() : null;

  const years = React.useMemo(() => {
    const from = fromDate ? fromDate.getFullYear() : year - 20;
    const to = toDate ? toDate.getFullYear() : year + 10;
    const arr: number[] = [];
    for (let y = from; y <= to; y++) arr.push(y);
    return arr;
  }, [fromDate, toDate, year]);

  const handleSelect = (day: number) => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    if (disabled?.(d)) return;
    onSelect?.(d);
  };

  const canPrev = !fromDate || addMonths(cursor, -1) >= startOfMonth(fromDate);
  const canNext = !toDate || addMonths(cursor, 1) <= startOfMonth(toDate);

  return (
    <div className={cn("rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated-1)] p-3 w-fit shadow-sm", className)}>
      {/* Caption */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <button
          aria-label="Previous month"
          onClick={() => canPrev && setCursor(addMonths(cursor, -1))}
          disabled={!canPrev}
          className="h-8 w-8 grid place-items-center rounded-md hover:bg-[var(--surface-elevated-2)] disabled:opacity-30 disabled:pointer-events-none"
        >
          ‹
        </button>

        {captionLayout === "dropdown" ? (
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Select month"
              value={month}
              onChange={(e) => setCursor(new Date(year, parseInt(e.target.value, 10), 1))}
              className="h-8 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated-1)] px-2 text-sm font-medium"
            >
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select
              aria-label="Select year"
              value={year}
              onChange={(e) => setCursor(new Date(parseInt(e.target.value, 10), month, 1))}
              className="h-8 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated-1)] px-2 text-sm font-medium"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        ) : (
          <div className="text-sm font-semibold tracking-tight">
            {MONTHS[month]} {year}
          </div>
        )}

        <button
          aria-label="Next month"
          onClick={() => canNext && setCursor(addMonths(cursor, 1))}
          disabled={!canNext}
          className="h-8 w-8 grid place-items-center rounded-md hover:bg-[var(--surface-elevated-2)] disabled:opacity-30 disabled:pointer-events-none"
        >
          ›
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="h-8 w-8 grid place-items-center text-xs font-medium text-[var(--text-tertiary)]">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8 w-8" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const d = new Date(year, month, day); d.setHours(0, 0, 0, 0);
          const isToday = d.getTime() === today.getTime();
          const isSelected = selectedTime !== null && d.getTime() === selectedTime;
          const isDisabled = disabled?.(d) ?? false;
          return (
            <button
              key={day}
              onClick={() => handleSelect(day)}
              disabled={isDisabled}
              aria-label={`${MONTHS[month]} ${day}, ${year}${isSelected ? ", selected" : ""}${isToday ? ", today" : ""}`}
              aria-pressed={isSelected}
              className={cn(
                "h-8 w-8 rounded-md text-sm grid place-items-center relative transition-colors",
                "hover:bg-[var(--surface-elevated-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-0",
                isToday && !isSelected && "ring-1 ring-[var(--accent-primary)] ring-inset font-semibold",
                isSelected && "bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)] shadow-sm",
                isDisabled && "opacity-30 pointer-events-none"
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// CalendarDemo removed — Calendar is used directly via Stitch design system
// Example usage (kept as comment for reference):
// <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-lg border" captionLayout="dropdown" />
