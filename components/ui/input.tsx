"use client";
import React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? (label ? `input-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-primary)]">
          {label} {props.required && <span className="text-[var(--semantic-danger)]">*</span>}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={cn(
          "h-11 w-full rounded-md border bg-[var(--surface-elevated-1)] px-3 text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 outline-none transition-colors",
          error ? "border-[var(--semantic-danger)]" : "border-[var(--border-subtle)]",
          className
        )}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" aria-live="polite" className="text-xs text-[var(--semantic-danger)] flex items-center gap-1">
          <span aria-hidden>⚠</span> {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-[var(--text-tertiary)]">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Textarea({ label, error, className, id, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  const inputId = id ?? (label ? `ta-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-primary)]">{label}</label>}
      <textarea
        id={inputId}
        aria-invalid={!!error}
        className={cn("w-full rounded-md border bg-[var(--surface-elevated-1)] p-3 text-[15px] min-h-[96px] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 outline-none", error ? "border-[var(--semantic-danger)]" : "border-[var(--border-subtle)]", className)}
        {...props}
      />
      {error && <p className="text-xs text-[var(--semantic-danger)]">{error}</p>}
    </div>
  );
}

export function Select({ label, error, children, className, id, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  const inputId = id ?? (label ? `sel-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-[var(--text-primary)]">{label}</label>}
      <select
        id={inputId}
        className={cn("h-11 w-full rounded-md border bg-[var(--surface-elevated-1)] px-3 text-[15px] focus:border-[var(--accent-primary)] outline-none", error ? "border-[var(--semantic-danger)]" : "border-[var(--border-subtle)]", className)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-[var(--semantic-danger)]">{error}</p>}
    </div>
  );
}
