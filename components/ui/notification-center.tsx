"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { NotificationService, type AppNotification } from "@/lib/services/notification.service";
import { Button } from "./button";
import { Icon } from "./icons";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<AppNotification[]>([]);

  const refresh = () => setNotes(NotificationService.getAll());

  useEffect(() => {
    refresh();
    const h = () => refresh();
    window.addEventListener("calexpenses:refresh", h as EventListener);
    window.addEventListener("storage", h);
    const iv = setInterval(refresh, 30000);
    return () => { window.removeEventListener("calexpenses:refresh", h as EventListener); window.removeEventListener("storage", h); clearInterval(iv); };
  }, []);

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  const unread = notes.filter((n) => n.unread).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications ${unread ? `(${unread} unread)` : ""}`}
        className="relative h-9 w-9 rounded-full bg-[var(--surface-elevated-2)] border border-[var(--border-subtle)] grid place-items-center hover:bg-[var(--surface-elevated-1)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 9a6 6 0 0 1 12 0c0 7-6 5-6 9H6s-6-2-6-9a6 6 0 0 1 12 0z" /><path d="M9 19a3 3 0 0 0 6 0" /></svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-[var(--semantic-danger)] text-white text-[11px] font-bold grid place-items-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-11 z-30 w-[360px] max-w-[92vw] rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated-1)] shadow-e3 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-sm font-semibold">Notifications</h3>
              <div className="flex gap-1.5">
                {unread > 0 && <button onClick={() => { NotificationService.markAllRead(); refresh(); }} className="text-xs text-[var(--accent-primary)] hover:underline">Mark all read</button>}
                <button onClick={() => setOpen(false)} aria-label="Close" className="h-7 w-7 grid place-items-center rounded hover:bg-[var(--surface-elevated-2)]">✕</button>
              </div>
            </div>

            <div className="max-h-[64vh] overflow-auto">
              {notes.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto h-10 w-10 rounded-full bg-[var(--surface-elevated-2)] grid place-items-center text-[var(--text-tertiary)]">🔔</div>
                  <p className="text-sm font-medium mt-3">All caught up</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">No upcoming bills, events or alerts. Add a bill, event or budget to see reminders here.</p>
                </div>
              ) : (
                <ul className="divide-y divide-[var(--border-subtle)]">
                  {notes.slice(0, 20).map((n) => (
                    <li key={n.id} className={`p-3 flex gap-3 hover:bg-[var(--surface-elevated-2)] ${n.unread ? "bg-[var(--accent-primary-subtle)]/50" : ""}`}>
                      <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${n.unread ? "bg-[var(--accent-primary)]" : "bg-[var(--border-subtle)]"}`} />
                      <div className="flex-1 min-w-0">
                        <Link href={n.href} onClick={() => { NotificationService.markRead(n.id); setOpen(false); }} className="text-sm font-medium leading-tight hover:underline block">
                          {n.title}
                        </Link>
                        <p className="text-xs text-[var(--text-secondary)] leading-snug truncate">{n.message}</p>
                        {n.date && <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{n.date}</p>}
                      </div>
                      <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full h-fit uppercase tracking-wide font-medium ${
                        n.type === "bill" ? "bg-amber-100 text-amber-800" :
                        n.type === "budget" ? "bg-red-100 text-red-700" :
                        n.type === "event" ? "bg-blue-100 text-blue-700" :
                        n.type === "gift" ? "bg-purple-100 text-purple-700" :
                        n.type === "goal" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"
                      }`}>{n.type}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {notes.length > 0 && (
              <div className="p-2 border-t border-[var(--border-subtle)] flex justify-between">
                <button onClick={() => { NotificationService.clearAllRead(); refresh(); }} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">Clear history</button>
                <Link href="/calendar" onClick={() => setOpen(false)} className="text-xs text-[var(--accent-primary)] hover:underline">Open calendar →</Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
