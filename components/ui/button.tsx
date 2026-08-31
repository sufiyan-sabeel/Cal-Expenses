"use client";
import React from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "destructive" | "ghost";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<Variant, string> = {
    primary: "bg-[var(--accent-primary)] text-white hover:opacity-90 shadow-sm",
    secondary: "bg-transparent border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--surface-elevated-2)]",
    destructive: "bg-[var(--semantic-danger)] text-white hover:opacity-90",
    ghost: "bg-transparent text-[var(--accent-primary)] hover:bg-[var(--accent-primary-subtle)]",
  };
  const sizes: Record<Size, string> = {
    sm: "h-8 px-3 text-sm",
    md: "h-11 px-4 text-[15px] min-h-[44px]",
    lg: "h-12 px-6 text-base",
    icon: "h-11 w-11 p-0",
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : (
        children
      )}
    </button>
  );
}
