"use client";
import React from "react";

type IconName =
  | "dashboard" | "calendar" | "expenses" | "income" | "budgets" | "goals"
  | "events" | "gifts" | "family" | "analytics" | "ai" | "automations" | "games"
  | "home" | "profile" | "settings" | "bell" | "add" | "search" | "share" | "alarm"
  | "trendingUp" | "trendingDown" | "wallet" | "receipt" | "target" | "gift" | "party" | "users" | "barChart" | "sparkles";

const paths: Record<IconName, React.ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4M7 13h3M12 13h3M17 13h.01M7 17h3M12 17h3" /></>,
  expenses: <><path d="M3 7a2 2 0 0 1 2-2h6l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /><path d="M12 11l5 5M17 11l-5 5" /></>,
  income: <><path d="M3 7a2 2 0 0 1 2-2h6l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /><path d="M12 11v6M12 11l-3 3M12 11l3 3" /></>,
  budgets: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 16l4-4 3 3 5-6" /></>,
  goals: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 8v2M12 14v2M8 12h2M14 12h2" /></>,
  events: <><path d="M8 8a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" /><path d="M14 9h4l1 1-1 1h-4" /><path d="M12 12v4l2 2M3 15a7 7 0 0 0 7 7h0a7 7 0 0 0 7-7" /></>,
  gifts: <><rect x="4" y="8" width="16" height="10" rx="1.5" /><path d="M4 12h16M12 8v10" /><path d="M8 8a3 3 0 0 1 6 0c0 2-3 3-3 3s-3-1-3-3z" /></>,
  family: <><circle cx="9" cy="8" r="3" /><circle cx="15" cy="8" r="3" /><path d="M5 18a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4" /><path d="M11 18a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4" /></>,
  analytics: <><path d="M3 3v18h18" /><path d="M7 16l3-3 3 3 5-8" /></>,
  ai: <><path d="M12 3l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" /><path d="M8 8l1 1" /><path d="M16 12l2 1" /></>,
  automations: <><circle cx="12" cy="12" r="3" /><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M18.4 18.4l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M18.4 5.6l2.1-2.1" /></>,
  games: <><rect x="5" y="7" width="14" height="10" rx="2" /><path d="M8 12h2M10 11v2M14 12h.01M15 11h.01M15 13h.01M14 14h.01" /></>,
  home: <><path d="M3 10L12 3l9 7v10a1 1 0 0 1-1 1h-6v-6H10v6H4a1 1 0 0 1-1-1V10z" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.2 4.2l1.5 1.5M19.8 19.8l-1.5-1.5M1 12h2M21 12h-2M4.2 19.8l1.5-1.5M19.8 4.2l-1.5-1.5" /></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 7-6 5-6 9H6s-6-2-6-9a6 6 0 0 1 12 0z" /><path d="M9 19a3 3 0 0 0 6 0" /></>,
  add: <><path d="M12 5v14M5 12h14" /></>,
  search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-3.5-3.5" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.2l6.8-3.2M8.6 13.8l6.8 3.2" /></>,
  alarm: <><circle cx="12" cy="13" r="8" /><path d="M12 9v5l3 2" /><path d="M5 3l2 2M19 3l-2 2" /></>,
  trendingUp: <><path d="M7 16l4-4 3 3 5-6" /><path d="M16 6h4v4" /></>,
  trendingDown: <><path d="M7 8l4 4 3-3 5 6" /><path d="M16 18h4v-4" /></>,
  wallet: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M16 10h4v4h-4z" /></>,
  receipt: <><path d="M6 2h12l-1 4 1 4-1 4 1 4H6l1-4-1-4 1-4-1-4z" /><path d="M9 9h6M9 13h6" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></>,
  gift: <><rect x="4" y="8" width="16" height="10" rx="1" /><path d="M4 12h16M12 8v10" /></>,
  party: <><path d="M12 3l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6z" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  barChart: <><path d="M12 20V10M8 20V14M16 20V6M3 20h18" /></>,
  sparkles: <><path d="M9 11l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" /><path d="M19 4l1 1.5 1.5 1-1.5 1L19 9l-1-1.5L16.5 6l1.5-1z" /></>,
};

export function Icon({ name, className, size = 18 }: { name: IconName; className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {paths[name]}
    </svg>
  );
}
