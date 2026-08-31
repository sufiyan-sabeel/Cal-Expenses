import React from "react";
import { cn } from "@/lib/utils/cn";

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "income" | "expense" | "warning" | "danger" | "info" }) {
  const variants: Record<string, string> = {
    default: "bg-[var(--surface-elevated-2)] text-[var(--text-secondary)]",
    income: "bg-[var(--semantic-income)]/15 text-[var(--semantic-income)]",
    expense: "bg-[var(--semantic-expense)]/15 text-[var(--semantic-expense)]",
    warning: "bg-[var(--semantic-warning)]/15 text-[var(--semantic-warning)]",
    danger: "bg-[var(--semantic-danger)]/15 text-[var(--semantic-danger)]",
    info: "bg-[var(--semantic-neutral-info)]/15 text-[var(--semantic-neutral-info)]",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", variants[variant ?? "default"], className)} {...props} />;
}
