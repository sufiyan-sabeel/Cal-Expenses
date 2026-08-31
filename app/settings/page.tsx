"use client";
import React, { useState } from "react";
import { ProfileService, SettingsService } from "@/lib/services/profile.service";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { buildExportPackage, downloadBlob, validateImportPackage, importReplace } from "@/lib/export";
import { StorageKeys } from "@/lib/storage/keys";
import { getStorageSync } from "@/lib/storage/storage-provider";

export default function SettingsPage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState(() => ProfileService.get());
  const [settings, setSettings] = useState(() => SettingsService.getOrCreate());
  const [importFile, setImportFile] = useState<File | null>(null);

  if (!profile) return <div className="p-8">No profile</div>;

  const saveProfile = (patch: any) => { const p = ProfileService.update(patch); setProfile(p); toast("Saved", "success"); };
  const saveSettings = (patch: any) => { const s = SettingsService.update(patch); setSettings(s); toast("Saved", "success"); };

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
    try { data = JSON.parse(text); } catch { toast("Invalid JSON", "error"); return; }
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
    // snapshot
    const pkg = buildExportPackage();
    s.setSync(StorageKeys.snapshotPreClear, pkg as any);
    keys.forEach((k) => { if (!k.includes("schemaMeta")) { try { localStorage.removeItem(k); } catch {} } });
    toast("Data cleared", "success");
    setTimeout(() => location.reload(), 600);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-semibold">Settings</h1>

      <Card>
        <h3 className="font-medium">Profile & Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <Input label="Display name" value={profile.displayName} onChange={(e) => saveProfile({ displayName: e.target.value })} />
          <Input label="Email (read-only)" value={profile.email} disabled />
          <Select label="Currency" value={profile.currency} onChange={(e) => saveProfile({ currency: e.target.value })}>
            <option>INR</option><option>USD</option><option>EUR</option><option>GBP</option>
          </Select>
          <Select label="Date format" value={profile.dateFormat} onChange={(e) => saveProfile({ dateFormat: e.target.value })}>
            <option value="DMY">DMY</option><option value="MDY">MDY</option><option value="YMD">YMD</option>
          </Select>
          <Select label="Theme" value={profile.theme} onChange={(e) => { saveProfile({ theme: e.target.value }); document.documentElement.classList.toggle("dark", e.target.value === "dark"); }}>
            <option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option>
          </Select>
          <Select label="First day of week" value={String(profile.firstDayOfWeek)} onChange={(e) => saveProfile({ firstDayOfWeek: parseInt(e.target.value, 10) })}>
            <option value="0">Sunday</option><option value="1">Monday</option>
          </Select>
          <Select label="AI enabled" value={String(profile.aiEnabled)} onChange={(e) => saveProfile({ aiEnabled: e.target.value === "true" })}>
            <option value="true">Enabled</option><option value="false">Disabled</option>
          </Select>
          <Select label="AI confirmation" value={profile.aiConfirmationMode} onChange={(e) => saveProfile({ aiConfirmationMode: e.target.value })}>
            <option value="quick-add-undo">Quick add with undo</option><option value="always-confirm">Always confirm</option>
          </Select>
        </div>
      </Card>

      <Card>
        <h3 className="font-medium">Privacy & Data</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">All financial data is local-only (calexpenses:v1:* keys). AI disabled = no network calls.</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button variant="secondary" onClick={exportJson}>Export JSON (full backup)</Button>
          <Button variant="secondary" onClick={exportCsv}>Export CSV (expenses)</Button>
          <Button variant="secondary" onClick={() => toast("PDF export generates client-side — use browser Print in Analytics for now", "info")}>Export PDF</Button>
        </div>
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-medium">Import backup</h4>
          <input type="file" accept=".json" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} className="mt-2 text-sm" />
          <Button className="mt-2" variant="secondary" onClick={handleImport}>Preview & Import</Button>
        </div>
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-medium text-[var(--semantic-danger)]">Danger zone</h4>
          <Button variant="destructive" className="mt-2" onClick={clearData}>Clear local data</Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-medium">Notifications</h3>
        <p className="text-sm text-[var(--text-secondary)]">Upcoming bills window: {settings.upcomingBillsWindowDays} days</p>
        <Input label="Upcoming bills window (days)" type="number" value={String(settings.upcomingBillsWindowDays)} onChange={(e) => saveSettings({ upcomingBillsWindowDays: parseInt(e.target.value, 10) || 7 })} />
      </Card>
    </div>
  );
}
