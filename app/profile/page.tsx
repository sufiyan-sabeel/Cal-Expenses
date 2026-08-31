"use client";
import React from "react";
import { ProfileService } from "@/lib/services/profile.service";
import { useAuth } from "@/lib/auth/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const profile = ProfileService.get();
  if (!profile) return <div className="p-8">No profile</div>;
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">Profile</h1>
      <Card className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center text-xl font-semibold">{profile.displayName[0]?.toUpperCase() ?? "U"}</div>
        <div className="flex-1">
          <div className="font-medium">{profile.displayName}</div>
          <div className="text-sm text-[var(--text-secondary)]">{profile.email} · {profile.authProvider}</div>
          <div className="text-xs text-[var(--text-tertiary)]">Currency {profile.currency} · Locale {profile.locale} · TZ {profile.timezone}</div>
        </div>
        <Logo variant="icon" size="md" />
      </Card>
      <Card>
        <h3 className="font-medium">Financial preferences</h3>
        <div className="text-sm mt-2 space-y-1"><div>Starting balance: ₹{profile.startingBalance}</div><div>Default budget period: {profile.defaultBudgetPeriod}</div><div>AI: {profile.aiEnabled ? "enabled" : "disabled"} ({profile.aiConfirmationMode})</div></div>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" onClick={() => router.push("/settings")}>Edit in Settings</Button>
          <Button variant="destructive" onClick={async () => { await logout(); router.push("/auth"); }}>Sign out</Button>
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-3">Sign out does not delete local data. Use Settings → Clear local data to remove device data.</p>
      </Card>
    </div>
  );
}
