"use client";
import React from "react";
import { cn } from "@/lib/utils/cn";

type LogoVariant = "mark" | "wordmark" | "stacked" | "icon";
type LogoSize = "sm" | "md" | "lg" | "xl";

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  showText?: boolean; // for mark variant
  priority?: boolean;
}

// Premium calendar-finance mark: calendar grid with expense indicator dot + subtle rupee/currency accent
export function Logo({ variant = "mark", size = "md", className, showText = true }: LogoProps) {
  const sizes: Record<LogoSize, { box: string; text: string; sub?: string }> = {
    sm: { box: "h-7 w-7", text: "text-sm" },
    md: { box: "h-8 w-8", text: "text-[15px]" },
    lg: { box: "h-10 w-10", text: "text-base" },
    xl: { box: "h-12 w-12", text: "text-lg" },
  };
  const s = sizes[size];

  const Mark = ({ boxClass }: { boxClass: string }) => (
    <div
      aria-hidden
      className={cn(
        "relative flex items-center justify-center rounded-md shrink-0 select-none",
        "bg-[var(--accent-primary)] text-white",
        "shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
        boxClass,
        className
      )}
      style={{ borderRadius: "10px" }}
    >
      {/* Subtle calendar grid */}
      <svg viewBox="0 0 32 32" className="h-[62%] w-[62%]" fill="none" aria-hidden>
        {/* Calendar outline */}
        <rect x="4" y="6" width="24" height="20" rx="3.5" fill="white" opacity="0.96" />
        {/* Top bar */}
        <rect x="4" y="6" width="24" height="6.5" rx="3.5" fill="white" />
        <rect x="4" y="9.5" width="24" height="3" fill="white" />
        <rect x="4" y="6" width="24" height="6" rx="3.5" fill="#EAF1FE" />
        {/* calendar rings */}
        <rect x="8.5" y="4.2" width="2.2" height="5" rx="1.1" fill="white" stroke="#2F6FED" strokeWidth="0.7" />
        <rect x="21.3" y="4.2" width="2.2" height="5" rx="1.1" fill="white" stroke="#2F6FED" strokeWidth="0.7" />
        {/* grid dots */}
        <circle cx="10" cy="15.5" r="1.2" fill="#2F6FED" />
        <circle cx="16" cy="15.5" r="1.2" fill="#D0D0D3" />
        <circle cx="22" cy="15.5" r="1.2" fill="#D0D0D3" />
        <circle cx="10" cy="20.2" r="1.2" fill="#D0D0D3" />
        {/* expense indicator: primary dot with rupee hint */}
        <circle cx="16" cy="20.2" r="1.45" fill="#2F6FED" />
        <circle cx="22" cy="20.2" r="1.2" fill="#1F9D6B" />
        {/* micro accent line */}
        <rect x="10" y="11.2" width="12" height="0.9" rx="0.45" fill="#2F6FED" opacity="0.85" />
      </svg>
    </div>
  );

  if (variant === "mark") {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <Mark boxClass={s.box} />
        {showText && (
          <div className="flex flex-col leading-none">
            <span className={cn("font-semibold tracking-[-0.02em] text-[var(--text-primary)]", s.text)} style={{ fontFamily: "var(--font-inter)" }}>
              CAL-EXPENSES
            </span>
            <span className="text-[10px] leading-[1] tracking-[0.08em] font-medium text-[var(--text-tertiary)] uppercase hidden sm:block">
              Your money. Your days.
            </span>
          </div>
        )}
      </div>
    );
  }

  if (variant === "wordmark") {
    return (
      <div className={cn("flex items-center gap-2.5", className)}>
        <Mark boxClass={s.box} />
        <span className={cn("font-semibold tracking-[-0.025em] text-[var(--text-primary)]", s.text)}>CAL-EXPENSES</span>
      </div>
    );
  }

  if (variant === "icon") {
    return <Mark boxClass={s.box} />;
  }

  // stacked for splash / auth
  return (
    <div className={cn("flex flex-col items-center text-center gap-3", className)}>
      <Mark boxClass={s.box} />
      <div>
        <div className={cn("font-semibold tracking-[-0.025em] text-[var(--text-primary)]", s.text)}>CAL-EXPENSES</div>
        <div className="text-xs tracking-[0.08em] font-medium text-[var(--text-secondary)] uppercase">Your money. Your days. One calendar.</div>
      </div>
    </div>
  );
}

// Tiny favicon SVG string for generating favicon
export const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="9" fill="#2F6FED"/><rect x="4" y="6" width="24" height="20" rx="3.5" fill="white" opacity="0.96"/><rect x="4" y="6" width="24" height="6" rx="3.5" fill="#EAF1FE"/><rect x="8.5" y="4.2" width="2.2" height="5" rx="1.1" fill="white" stroke="#2F6FED" stroke-width="0.7"/><rect x="21.3" y="4.2" width="2.2" height="5" rx="1.1" fill="white" stroke="#2F6FED" stroke-width="0.7"/><circle cx="10" cy="15.5" r="1.2" fill="#2F6FED"/><circle cx="16" cy="15.5" r="1.2" fill="#D0D0D3"/><circle cx="22" cy="15.5" r="1.2" fill="#D0D0D3"/><circle cx="10" cy="20.2" r="1.2" fill="#D0D0D3"/><circle cx="16" cy="20.2" r="1.45" fill="#2F6FED"/><circle cx="22" cy="20.2" r="1.2" fill="#1F9D6B"/><rect x="10" y="11.2" width="12" height="0.9" rx="0.45" fill="#2F6FED" opacity="0.85"/></svg>`;
