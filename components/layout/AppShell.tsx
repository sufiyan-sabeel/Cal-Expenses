"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { Logo } from "@/components/ui/logo";
import { NotificationCenter } from "@/components/ui/notification-center";

const DESKTOP_NAV = [
  { href: "/dashboard", label: "Overview", icon: "◈" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/expenses", label: "Expenses", icon: "💸" },
  { href: "/income", label: "Income", icon: "💰" },
  { href: "/budgets", label: "Budgets", icon: "📊" },
  { href: "/goals", label: "Goals", icon: "🎯" },
  { href: "/events", label: "Events", icon: "🎉" },
  { href: "/gifts", label: "Gifts", icon: "🎁" },
  { href: "/family", label: "Family", icon: "👨‍👩‍👧" },
  { href: "/analytics", label: "Analytics", icon: "📈" },
  { href: "/ai", label: "AI Assistant", icon: "✦" },
  { href: "/automations", label: "Automations", icon: "⚙" },
  { href: "/games", label: "Games", icon: "🎮" },
];

const MOBILE_NAV = [
  { href: "/dashboard", label: "Home", icon: "⌂" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/ai", label: "AI", icon: "✦" },
  { href: "/profile", label: "Profile", icon: "◉" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthPage = pathname?.startsWith("/auth") || pathname?.startsWith("/onboarding");
  if (isAuthPage) return <>{children}</>;

  // Not authed: show minimal shell without nav (page will handle redirect)
  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex bg-[var(--surface-canvas)]">
      {/* Desktop sidebar */}
      <aside className={cn("hidden lg:flex flex-col w-[260px] shrink-0 border-r border-[var(--border-subtle)] bg-[var(--surface-elevated-1)] sticky top-0 h-screen overflow-auto", sidebarOpen ? "flex fixed inset-0 z-40 lg:static" : "")}>
        <div className="h-[64px] flex items-center px-5 border-b border-[var(--border-subtle)] shrink-0">
          <Link href="/dashboard" aria-label="CAL-EXPENSES home" className="flex items-center">
            <Logo variant="mark" size="md" />
          </Link>
          <button className="lg:hidden ml-auto p-2 rounded-md hover:bg-[var(--surface-elevated-2)]" onClick={() => setSidebarOpen(false)} aria-label="Close menu">✕</button>
        </div>
        <nav className="flex-1 p-3 space-y-1" aria-label="Primary">
          {DESKTOP_NAV.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--accent-primary-subtle)] text-[var(--accent-primary)] border-l-2 border-[var(--accent-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-elevated-2)] hover:text-[var(--text-primary)]"
                )}
              >
                <span aria-hidden className="w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[var(--border-subtle)] space-y-2">
          <Link href="/settings" className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <span aria-hidden>⚙</span> Settings
          </Link>
          <Button variant="ghost" size="sm" onClick={() => logout().then(() => router.push("/auth"))} className="w-full justify-start px-0">
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-[64px] flex items-center justify-between px-4 lg:px-6 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated-1)] sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-md border border-[var(--border-subtle)] min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle navigation">☰</button>
            <Link href="/dashboard" className="lg:hidden" aria-label="Home">
              <Logo variant="mark" size="sm" />
            </Link>
            <div className="hidden lg:block text-sm text-[var(--text-tertiary)]">
              Your money. Your days. One calendar.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <Button variant="primary" size="sm" onClick={() => setShowAdd(true)} aria-label="Add transaction">
              + Add
            </Button>
            <Link href="/profile" className="h-9 w-9 rounded-full bg-[var(--surface-elevated-2)] flex items-center justify-center text-sm font-medium border border-[var(--border-subtle)]" aria-label="Profile">
              {(user as any)?.displayName?.[0] ?? (user as any)?.email?.[0] ?? "U"}
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>

        {/* Mobile bottom nav — 44px touch targets, glass, safe-area */}
        <nav aria-label="Mobile primary" className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--surface-elevated-1)]/85 backdrop-blur-[16px] border-t border-[var(--border-subtle)] flex items-center justify-around h-[68px] px-1 z-20 pb-[env(safe-area-inset-bottom)]">
          {MOBILE_NAV.slice(0, 2).map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] px-3 py-1 rounded-md transition-colors", active ? "text-[var(--accent-primary)] bg-[var(--accent-primary-subtle)]" : "text-[var(--text-tertiary)]")}>
                <span aria-hidden className="text-[18px] leading-none">{item.icon}</span>
                <span className="text-[10px] font-medium leading-none tracking-wide">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowAdd(true)}
            aria-label="Quick add transaction"
            className="h-[56px] w-[56px] rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center text-[28px] leading-none shadow-e2 -mt-5 border-[4px] border-[var(--surface-canvas)] active:scale-[0.96] transition-transform min-h-[56px] min-w-[56px]"
          >
            <span aria-hidden className="translate-y-[-1px]">+</span>
          </button>
          {MOBILE_NAV.slice(2).map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] px-3 py-1 rounded-md transition-colors", active ? "text-[var(--accent-primary)] bg-[var(--accent-primary-subtle)]" : "text-[var(--text-tertiary)]")}>
                <span aria-hidden className="text-[18px] leading-none">{item.icon}</span>
                <span className="text-[10px] font-medium leading-none tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Add sheet */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
            <div className="absolute inset-0 bg-[var(--surface-overlay)]" onClick={() => setShowAdd(false)} aria-hidden />
            <div className="relative bg-[var(--surface-elevated-1)] w-full lg:max-w-md rounded-t-lg lg:rounded-lg p-6 shadow-e3 border border-[var(--border-subtle)] animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Quick Add</h2>
                <button onClick={() => setShowAdd(false)} aria-label="Close" className="p-2">✕</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Expense", href: "/expenses?action=new", icon: "💸" },
                  { label: "Income", href: "/income?action=new", icon: "💰" },
                  { label: "Event", href: "/events?action=new", icon: "🎉" },
                  { label: "Bill", href: "/recurring?action=new", icon: "🧾" },
                  { label: "Gift", href: "/gifts?action=new", icon: "🎁" },
                  { label: "Goal", href: "/goals?action=new", icon: "🎯" },
                ].map((a) => (
                  <Link
                    key={a.label}
                    href={a.href}
                    onClick={() => setShowAdd(false)}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--surface-elevated-2)] transition-colors"
                  >
                    <span className="text-2xl" aria-hidden>{a.icon}</span>
                    <span className="text-sm font-medium">{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
