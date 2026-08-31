"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { ProfileService } from "@/lib/services/profile.service";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";

export default function Onboarding() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [currency, setCurrency] = useState("INR");
  const [locale, setLocale] = useState("en-IN");
  const [startingBalance, setStartingBalance] = useState("0");
  const [aiEnabled, setAiEnabled] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (!user) return null;

  const finish = (skip = false) => {
    ProfileService.completeOnboarding({
      currency: skip ? "INR" : currency,
      locale: skip ? "en-IN" : locale,
      startingBalance: skip ? 0 : parseFloat(startingBalance) || 0,
      aiEnabled: skip ? true : aiEnabled,
    });
    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--surface-canvas)]">
      <Card className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <Logo variant="icon" size="md" />
          <div className="flex-1">
            <h1 className="text-xl font-semibold tracking-[-0.02em]">Welcome to CAL-EXPENSES</h1>
            <p className="text-xs text-[var(--text-tertiary)]">Step {step} of 3 — Takes ~30 seconds</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-[var(--surface-elevated-2)] text-[var(--text-secondary)]">{step}/3</span>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-medium">Currency & locale</h2>
            <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="INR">INR — Indian Rupee</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — Pound</option>
            </Select>
            <Select label="Locale" value={locale} onChange={(e) => setLocale(e.target.value)}>
              <option value="en-IN">en-IN</option>
              <option value="en-US">en-US</option>
              <option value="en-GB">en-GB</option>
            </Select>
            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => finish(true)}>Skip</Button>
              <Button onClick={() => setStep(2)}>Next</Button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-medium">Starting balance (optional)</h2>
            <Input label="Starting balance" type="number" value={startingBalance} onChange={(e) => setStartingBalance(e.target.value)} placeholder="0" hint="Helps make 'Current Balance' meaningful. Default 0." />
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Next</Button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-medium">AI Assistant</h2>
            <p className="text-sm text-[var(--text-secondary)]">The AI can help log expenses via natural language. It never invents amounts — every write is validated and shown for confirmation. Minimal data leaves the device only for the AI proxy call.</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} />
              Enable AI Assistant
            </label>
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => finish()}>Finish → Dashboard</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
