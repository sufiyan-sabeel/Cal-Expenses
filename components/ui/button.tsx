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
  const base = "inline-flex items-center justify-center font-semibold rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-500)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]";
  const variants: Record<Variant, string> = {
    primary: "bg-[var(--color-brand-500)] text-white hover:bg-[var(--color-brand-600)] shadow-sm",
    secondary: "bg-transparent border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]",
    destructive: "bg-[var(--color-error)] text-white hover:bg-[#A93226]",
    ghost: "bg-transparent text-[var(--color-brand-500)] hover:bg-[var(--color-brand-50)]",
  };
  const sizes: Record<Size, string> = {
    sm: "h-8 px-3 text-sm",
    md: "h-12 px-4 text-[15px] min-h-[48px] md:min-h-[44px] md:h-11",
    lg: "h-12 px-6 text-base min-h-[48px]",
    icon: "h-11 w-11 p-0 min-h-[44px] min-w-[44px]",
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
