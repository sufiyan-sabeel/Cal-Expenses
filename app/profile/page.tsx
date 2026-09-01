"use client";
import React, { useEffect, useState } from "react";
import { ProfileService, SettingsService } from "@/lib/services/profile.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";

function SkeletonProfile() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-4 p-4 border bg-[var(--color-surface)]" style={{ borderRadius: "var(--radius-md)", borderColor: "var(--color-border)" }}>
        <div className="skeleton h-14 w-14 rounded-full" />
        <div className="space-y-2 flex-1"><div className="skeleton h-4 w-32" /><div className="skeleton h-3 w-48" /></div>
      </div>
      <div className="skeleton h-40 w-full" style={{ borderRadius: "var(--radius-md)" }} />
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(() => ProfileService.get());
  const [settings, setSettings] = useState(() => SettingsService.getOrCreate());
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const h = () => { try { setProfile(ProfileService.get()); setSettings(SettingsService.getOrCreate()); setLoadError(null); } catch (e) { setLoadError((e as Error).message); } };
    window.addEventListener("calexpenses:refresh", h as EventListener);
    window.addEventListener("storage", h);
    return () => { window.removeEventListener("calexpenses:refresh", h as EventListener); window.removeEventListener("storage", h); };
  }, []);

  if (!mounted) return <SkeletonProfile />;
  if (loadError) {
    return (
      <div className="max-w-2xl space-y-4">
        <div role="alert" className="flex items-center justify-between gap-3 border p-3" style={{ borderRadius: "var(--radius-md)", background: "var(--color-error-bg)", borderColor: "var(--color-error)", color: "var(--color-error)" }}>
          <span className="text-sm font-medium">We couldn&apos;t load profile: {loadError}</span>
          <Button variant="secondary" size="sm" onClick={() => { setProfile(ProfileService.get()); setLoadError(null); }}>Retry</Button>
        </div>
      </div>
    );
  }
  if (!profile) return <div className="p-8" style={{ color: "var(--color-text-secondary)" }}>No profile — please sign in.</div>;

  const groupedPrefs = [
    { label: "Currency", value: profile.currency },
    { label: "Locale", value: profile.locale },
    { label: "Time zone", value: profile.timezone },
    { label: "Date format", value: profile.dateFormat },
    { label: "First day of week", value: profile.firstDayOfWeek === 0 ? "Sunday" : "Monday" },
    { label: "Theme", value: profile.theme },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-bold tracking-tight" style={{ fontSize: "var(--font-size-h1)", color: "var(--color-text-primary)" }}>Profile</h1>
        <p className="mt-1" style={{ fontSize: "var(--font-size-body-sm)", color: "var(--color-text-secondary)" }}>Your local identity, preferences and data controls — all stored on this device.</p>
      </div>

      {/* Profile identity §34 */}
      <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        <div className="flex items-center gap-4">
          <div
            className="h-14 w-14 rounded-full flex items-center justify-center text-white font-bold shrink-0"
            style={{ background: "var(--color-brand-500)", borderRadius: "var(--radius-full)", fontSize: "1.25rem" }}
            aria-hidden
          >
            {profile.displayName[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-text-primary)" }}>{profile.displayName}</div>
            <div className="truncate flex items-center gap-1.5" style={{ fontSize: "var(--font-size-body-sm)", color: "var(--color-text-secondary)" }}>
              <Icon name="profile" size={12} /> {profile.email} <span className="hidden sm:inline">·</span> <span className="hidden sm:inline capitalize">{profile.authProvider}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium border" style={{ borderRadius: "var(--radius-full)", background: "var(--color-surface-hover)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>{profile.currency}</span>
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium border" style={{ borderRadius: "var(--radius-full)", background: "var(--color-surface-hover)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>{profile.locale}</span>
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium border" style={{ borderRadius: "var(--radius-full)", background: "var(--color-surface-hover)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>{profile.timezone}</span>
            </div>
          </div>
          <div className="hidden sm:grid place-items-center h-9 w-9 rounded-md border bg-[var(--color-surface-hover)]" style={{ borderColor: "var(--color-border)", borderRadius: "var(--radius-sm)" }}>
            <Logo variant="icon" size="md" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="secondary" onClick={() => router.push("/settings")} style={{ minHeight: 44 }} aria-label="Edit profile in Settings"><Icon name="settings" size={16} /> Edit in Settings</Button>
          <Button variant="ghost" onClick={async () => { await logout(); router.push("/auth"); }} style={{ minHeight: 44 }}>Sign out</Button>
        </div>
        <p className="mt-3" style={{ fontSize: "var(--font-size-caption)", color: "var(--color-text-muted)" }}>Sign out does not delete local data. Use Settings → Clear local data to remove device data. Local-only, no cloud sync.</p>
      </Card>

      {/* Preferences §34 */}
      <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-text-primary)" }}><Icon name="settings" size={16} /> Preferences</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {groupedPrefs.map((p) => (
            <div key={p.label} className="flex justify-between items-center p-3 border" style={{ borderRadius: "var(--radius-sm)", borderColor: "var(--color-border)", background: "var(--color-surface-hover)" }}>
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{p.label}</span>
              <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--color-text-primary)" }}>{p.value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Financial preferences */}
      <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-text-primary)" }}><Icon name="wallet" size={16} /> Financial preferences</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "var(--color-border)" }}><span style={{ color: "var(--color-text-secondary)" }}>Starting balance</span><span className="font-semibold tabular-nums" style={{ color: "var(--color-text-primary)" }}>₹{profile.startingBalance.toFixed(0)}</span></div>
          <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "var(--color-border)" }}><span style={{ color: "var(--color-text-secondary)" }}>Default budget period</span><span className="font-medium capitalize" style={{ color: "var(--color-text-primary)" }}>{profile.defaultBudgetPeriod}</span></div>
          <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "var(--color-border)" }}><span style={{ color: "var(--color-text-secondary)" }}>Default payment method</span><span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{profile.defaultPaymentMethod ?? "—"}</span></div>
          <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "var(--color-border)" }}><span style={{ color: "var(--color-text-secondary)" }}>Week start</span><span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{profile.firstDayOfWeek === 0 ? "Sunday" : "Monday"}</span></div>
          <div className="flex justify-between items-center py-2"><span style={{ color: "var(--color-text-secondary)" }}>AI</span><span className="font-medium inline-flex items-center gap-1.5" style={{ color: profile.aiEnabled ? "var(--color-ai)" : "var(--color-text-muted)" }}><Icon name="ai" size={12} /> {profile.aiEnabled ? `enabled (${profile.aiConfirmationMode})` : "disabled"}</span></div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" onClick={() => router.push("/settings")} style={{ minHeight: 44 }}>Edit in Settings</Button>
          <Button variant="ghost" onClick={() => router.push("/analytics")} style={{ minHeight: 44 }}><Icon name="barChart" size={16} /> View analytics</Button>
        </div>
      </Card>

      {/* Privacy §34 */}
      <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-text-primary)" }}><Icon name="receipt" size={16} /> Privacy — local data</h3>
        <p className="mt-2" style={{ fontSize: "var(--font-size-body-sm)", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
          All financial data is stored locally under <span className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: "var(--color-surface-hover)", border: "1px solid var(--color-border)" }}>calexpenses:v1:*</span> keys. AI is off when {profile.aiEnabled ? "disabled in Settings — no network calls" : "you disable it"}; PDFs are generated client-side. Nothing is synced automatically.
        </p>
        <div className="mt-3 text-xs p-3 border" style={{ borderRadius: "var(--radius-sm)", background: "var(--color-surface-hover)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
          <div className="flex items-center gap-2 font-medium" style={{ color: "var(--color-text-primary)" }}><Icon name="analytics" size={12} /> Notifications</div>
          <div className="mt-1">Upcoming bills window: {settings.upcomingBillsWindowDays} days · Events window: {settings.upcomingEventsWindowDays} days</div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={() => router.push("/settings")} style={{ minHeight: 44 }}>Open Export Center</Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/settings")} style={{ minHeight: 44, color: "var(--color-error)" }}>Clear local data</Button>
        </div>
      </Card>

      {/* Data management — grouped, visually separated by divider and muted bg */}
      <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)", background: "var(--color-surface-hover)" }}>
        <h3 className="font-semibold" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-text-primary)" }}>Data management</h3>
        <p className="mt-1" style={{ fontSize: "var(--font-size-body-sm)", color: "var(--color-text-secondary)" }}>Export, Import and Clear are grouped here and visually separated from non-destructive settings.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
          <Button variant="secondary" size="sm" onClick={() => router.push("/settings")} style={{ minHeight: 44 }}><Icon name="receipt" size={14} /> Export</Button>
          <Button variant="secondary" size="sm" onClick={() => router.push("/settings")} style={{ minHeight: 44 }}>Import</Button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/settings")} style={{ minHeight: 44, color: "var(--color-error)" }}>Clear data</Button>
        </div>
        <p className="mt-3" style={{ fontSize: "var(--font-size-caption)", color: "var(--color-text-muted)" }}>Clearing data asks for explicit confirmation (“CLEAR”) and saves a pre-clear snapshot if you use Settings → Clear local data.</p>
      </Card>
    </div>
  );
}
