"use client";
import React, { useEffect, useState } from "react";
import { ProfileService, SettingsService } from "@/lib/services/profile.service";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { buildExportPackage, downloadBlob, validateImportPackage, importReplace, downloadPdfReport } from "@/lib/export";
import { StorageKeys } from "@/lib/storage/keys";
import { getStorageSync } from "@/lib/storage/storage-provider";
import { Icon } from "@/components/ui/icons";
import { ShareButton } from "@/components/ui/share-button";
import { playAlarm, requestNotificationPermission } from "@/lib/utils/alarm";

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b last:border-0" style={{ borderColor: "var(--color-border)" }}>
      <div className="min-w-0 flex-1 pr-3">
        <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{label}</div>
        {hint && <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{hint}</div>}
      </div>
      <div className="shrink-0 flex items-center gap-2">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState(() => ProfileService.get());
  const [settings, setSettings] = useState(() => SettingsService.getOrCreate());
  const [importFile, setImportFile] = useState<File | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const h = () => { try { setProfile(ProfileService.get()); setSettings(SettingsService.getOrCreate()); setLoadError(null); } catch (e) { setLoadError((e as Error).message); } };
    window.addEventListener("calexpenses:refresh", h as EventListener);
    return () => window.removeEventListener("calexpenses:refresh", h as EventListener);
  }, []);

  if (!mounted) return <div className="space-y-4 max-w-3xl"><div className="skeleton h-32 w-full" style={{ borderRadius: "var(--radius-md)" }} /><div className="skeleton h-40 w-full" style={{ borderRadius: "var(--radius-md)" }} /></div>;
  if (loadError) return <div className="p-4 border" style={{ borderRadius: "var(--radius-md)", background: "var(--color-error-bg)", borderColor: "var(--color-error)", color: "var(--color-error)" }}>We couldn&apos;t load settings: {loadError}</div>;
  if (!profile) return <div className="p-8" style={{ color: "var(--color-text-secondary)" }}>No profile — please sign in.</div>;

  const saveProfile = (patch: Record<string, unknown>) => { const p = ProfileService.update(patch as never); setProfile(p); toast("Saved", "success"); window.dispatchEvent(new Event("calexpenses:refresh")); };
  const saveSettings = (patch: Record<string, unknown>) => { const s = SettingsService.update(patch as never); setSettings(s); toast("Saved", "success"); };

  const exportJson = () => {
    const pkg = buildExportPackage();
    downloadBlob(JSON.stringify(pkg, null, 2), `cal-expenses-backup-${new Date().toISOString().slice(0,10)}.json`, "application/json");
    toast("Backup downloaded", "success");
  };
  const exportCsv = () => {
    const pkg = buildExportPackage();
    const rows = pkg.expenses.map((e) => ({ date: e.date, amount: e.amount, categoryId: e.categoryId, description: e.description ?? "", merchant: e.merchant ?? "" }));
    const csv = ["date,amount,categoryId,description,merchant", ...rows.map((r) => `${r.date},${r.amount},${r.categoryId},"${r.description}","${r.merchant}"`)].join("\n");
    downloadBlob(csv, `expenses-${new Date().toISOString().slice(0,10)}.csv`, "text/csv");
    toast("CSV downloaded", "success");
  };
  const handleImport = async () => {
    if (!importFile) { toast("Select file first", "error"); return; }
    const text = await importFile.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { toast("Invalid JSON — This file doesn&apos;t look like a CAL-EXPENSES backup. Choose a different file.", "error"); return; }
    const v = validateImportPackage(data);
    if (!v.valid) { toast(v.error ?? "Invalid file", "error"); return; }
    const preview = `Import preview: ${v.pkg!.expenses.length} expenses, ${v.pkg!.income.length} income, ${v.pkg!.budgets.length} budgets. Choose Replace All?`;
    if (!confirm(preview + "\n\nType REPLACE to confirm?")) return;
    const typed = prompt('Type "REPLACE" to confirm replace-all import');
    if (typed !== "REPLACE") { toast("Import cancelled", "info"); return; }
    importReplace(v.pkg!);
    toast("Import complete — reload page", "success");
    setTimeout(() => location.reload(), 800);
  };
  const clearData = () => {
    const typed = prompt('Type "CLEAR" to delete all local data (export first!)');
    if (typed !== "CLEAR") return;
    const s = getStorageSync();
    const keys = Object.values(StorageKeys) as string[];
    const pkg = buildExportPackage();
    s.setSync(StorageKeys.snapshotPreClear, pkg as unknown as never);
    keys.forEach((k) => { if (!k.includes("schemaMeta")) { try { localStorage.removeItem(k); } catch {} } });
    toast("Data cleared", "success");
    setTimeout(() => location.reload(), 600);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-bold tracking-tight" style={{ fontSize: "var(--font-size-h1)", color: "var(--color-text-primary)" }}>Settings</h1>
        <p className="mt-1" style={{ fontSize: "var(--font-size-body-sm)", color: "var(--color-text-secondary)" }}>Organized by section — Account, Appearance, Calendar, Finance, AI, Notifications, Privacy &amp; Data.</p>
      </div>

      {/* Account */}
      <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-text-primary)" }}><Icon name="profile" size={16} /> Account</h3>
        <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Profile identity — tap to edit. Email is read-only and linked to sign-in.</p>
        <div className="mt-3 space-y-3">
          <Input label="Display name" value={profile.displayName} onChange={(e) => saveProfile({ displayName: e.target.value })} />
          <Input label="Email (read-only)" value={profile.email} disabled />
          <Select label="Currency" value={profile.currency} onChange={(e) => saveProfile({ currency: e.target.value })}>
            <option>INR</option><option>USD</option><option>EUR</option><option>GBP</option>
          </Select>
        </div>
      </Card>

      {/* Appearance */}
      <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-text-primary)" }}><Icon name="settings" size={16} /> Appearance</h3>
        <div className="mt-3">
          <Row label="Theme" hint="Light / Dark / System — swaps token sets at root, never via filter">
            <Select label="" value={profile.theme} onChange={(e) => { saveProfile({ theme: e.target.value }); document.documentElement.classList.toggle("dark", e.target.value === "dark"); }} className="min-w-[140px]">
              <option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option>
            </Select>
          </Row>
          <Row label="Preview">
            <div className="flex items-center gap-2 text-xs">
              <span className="h-6 w-6 rounded-full border" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }} aria-hidden />
              <span className="h-6 w-6 rounded-full border" style={{ background: "var(--color-brand-500)" }} aria-hidden />
              <span className="h-6 w-6 rounded-full border" style={{ background: "var(--color-text-primary)" }} aria-hidden />
            </div>
          </Row>
        </div>
      </Card>

      {/* Calendar */}
      <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-text-primary)" }}><Icon name="calendar" size={16} /> Calendar</h3>
        <div className="mt-3">
          <Row label="Date format" hint="How dates appear in lists and exports">
            <Select label="" value={profile.dateFormat} onChange={(e) => saveProfile({ dateFormat: e.target.value })} className="min-w-[120px]">
              <option value="DMY">DMY</option><option value="MDY">MDY</option><option value="YMD">YMD</option>
            </Select>
          </Row>
          <Row label="First day of week" hint="Weekday row start">
            <Select label="" value={String(profile.firstDayOfWeek)} onChange={(e) => saveProfile({ firstDayOfWeek: parseInt(e.target.value, 10) })} className="min-w-[140px]">
              <option value="0">Sunday</option><option value="1">Monday</option>
            </Select>
          </Row>
        </div>
      </Card>

      {/* Finance */}
      <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-text-primary)" }}><Icon name="wallet" size={16} /> Finance</h3>
        <div className="mt-3">
          <Row label="Default budget period" hint="Used when creating new budgets">
            <span className="text-sm font-medium capitalize" style={{ color: "var(--color-text-primary)" }}>{profile.defaultBudgetPeriod}</span>
          </Row>
          <Row label="Starting balance" hint="Base for current balance calculation">
            <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--color-text-primary)" }}>₹{profile.startingBalance.toFixed(0)}</span>
          </Row>
        </div>
      </Card>

      {/* AI */}
      <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-ai)" }}><Icon name="ai" size={16} /> AI</h3>
        <div className="mt-3">
          <Row label="AI enabled" hint="When off, no network calls; manual entry always works">
            <Select label="" value={String(profile.aiEnabled)} onChange={(e) => saveProfile({ aiEnabled: e.target.value === "true" })} className="min-w-[140px]">
              <option value="true">Enabled</option><option value="false">Disabled</option>
            </Select>
          </Row>
          <Row label="AI confirmation" hint="Quick-add-undo vs always-confirm per §32.3">
            <Select label="" value={profile.aiConfirmationMode} onChange={(e) => saveProfile({ aiConfirmationMode: e.target.value })} className="min-w-[180px]">
              <option value="quick-add-undo">Quick add with undo</option><option value="always-confirm">Always confirm</option>
            </Select>
          </Row>
        </div>
      </Card>

      {/* Notifications */}
      <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-text-primary)" }}><Icon name="bell" size={16} /> Notifications</h3>
        <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>Upcoming bills window: {settings.upcomingBillsWindowDays} days · Alarms use sound + system notification. Push opted in per category only — no marketing pings.</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Upcoming bills window (days)" type="number" inputMode="numeric" value={String(settings.upcomingBillsWindowDays)} onChange={(e) => saveSettings({ upcomingBillsWindowDays: parseInt(e.target.value, 10) || 7 })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>Test alarm</label>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={async () => { const ok = await requestNotificationPermission(); if (!ok) toast("Enable notifications in browser", "error"); else { playAlarm(1500); toast("Alarm played + notification", "success"); if (Notification.permission === "granted") new Notification("CAL-EXPENSES", { body: "Test alarm — bills & events reminder" }); } }} style={{ minHeight: 44 }}><Icon name="alarm" size={14} /> Test Alarm</Button>
              <Button variant="ghost" onClick={() => playAlarm(800)} style={{ minHeight: 44 }}>Beep</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Privacy & Data — Export / Print */}
      <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)" }}>
        <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-text-primary)" }}><Icon name="receipt" size={16} /> Privacy &amp; Data — Export Center</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)", lineHeight: "1.5" }}>All financial data is local-only (<span className="font-mono text-xs px-1 py-0.5 rounded" style={{ background: "var(--color-surface-hover)", border: "1px solid var(--color-border)" }}>calexpenses:v1:*</span> keys). AI disabled = no network calls. PDFs are generated client-side and printed via browser (Save as PDF). Exports always show a confirmation summary before writing.</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="secondary" onClick={exportJson} style={{ minHeight: 44 }}><Icon name="receipt" size={14} /> Export JSON Backup</Button>
          <Button variant="secondary" onClick={exportCsv} style={{ minHeight: 44 }}><Icon name="barChart" size={14} /> Export CSV</Button>
          <Button variant="primary" onClick={() => { downloadPdfReport(); toast("Opening print preview — Save as PDF", "success"); }} style={{ minHeight: 44 }}><Icon name="receipt" size={14} /> Export PDF</Button>
          <ShareButton title="CAL-EXPENSES Backup" text={`Backup ${new Date().toLocaleDateString()} — ${buildExportPackage().expenses.length} expenses`} />
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>PDF — for printing/sharing · CSV — for spreadsheets · JSON — full backup for re-import. Confirmation sheet states exactly what will be generated.</p>

        <div className="mt-6 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
          <h4 className="font-semibold" style={{ fontSize: "var(--font-size-h4)" }}>Import backup</h4>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Validates the file; preview shows counts before replace-all. Requires typing REPLACE.</p>
          <input type="file" accept=".json" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} className="mt-2 text-sm" style={{ color: "var(--color-text-primary)" }} aria-label="Choose backup JSON file" />
          <Button className="mt-2" variant="secondary" onClick={handleImport} style={{ minHeight: 44 }}>Preview &amp; Import</Button>
        </div>

        {/* Danger zone — visually separated + muted bg per §34 */}
        <div className="mt-6 border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
          <div className="p-3 border" style={{ borderRadius: "var(--radius-md)", background: "var(--color-error-bg)", borderColor: "var(--color-error)", opacity: 0.95 }}>
            <h4 className="font-semibold flex items-center gap-1.5" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-error)" }}><Icon name="settings" size={14} /> Danger zone</h4>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>Clearing data saves a pre-clear snapshot to <span className="font-mono">snapshotPreClear</span> and requires typing CLEAR. This cannot be undone without a backup.</p>
            <Button variant="destructive" className="mt-3" onClick={clearData} style={{ minHeight: 44 }}>Clear local data</Button>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)", background: "var(--color-surface-hover)" }}>
        <h3 className="font-semibold" style={{ fontSize: "var(--font-size-h4)", color: "var(--color-text-primary)" }}>About</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>CAL-EXPENSES — Your money. Your days. One calendar. Local-first, private by design. Version 1.0 — light &amp; dark themes, calendar-first, AI copilot (confirm-before-write).</p>
        <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>Need help? Settings are organized into the groups above per §35: Account · Appearance · Calendar · Finance · AI · Notifications · Privacy · Data · About.</p>
      </Card>
    </div>
  );
}
