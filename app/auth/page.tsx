"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export default function AuthPage() {
  const { user, loading, signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      const raw = typeof window !== "undefined" ? localStorage.getItem("calexpenses:v1:profile") : null;
      const profile = raw ? JSON.parse(raw) : null;
      if (profile?.onboardingCompleted) router.replace("/dashboard");
      else router.replace("/onboarding");
    }
  }, [user, loading, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") await signIn(email, password);
      else await signUp(email, password, name);
      toast(mode === "signin" ? "Signed in successfully" : "Account created", "success");
      router.replace("/onboarding");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--surface-canvas)]">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6 flex flex-col items-center gap-3">
          <div className="mx-auto"><Logo variant="icon" size="xl" /></div>
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.02em]">CAL-EXPENSES</h1>
            <p className="text-sm text-[var(--text-secondary)]">Your money. Your days. One calendar.</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Data stays on this device · No cloud database</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4 p-1 bg-[var(--surface-elevated-2)] rounded-md">
          <button onClick={() => setMode("signin")} className={`flex-1 py-2 rounded-md text-sm font-medium ${mode === "signin" ? "bg-[var(--surface-elevated-1)] shadow-sm" : "text-[var(--text-secondary)]"}`}>Sign in</button>
          <button onClick={() => setMode("signup")} className={`flex-1 py-2 rounded-md text-sm font-medium ${mode === "signup" ? "bg-[var(--surface-elevated-1)] shadow-sm" : "text-[var(--text-secondary)]"}`}>Sign up</button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && <Input label="Display name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />}
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 chars, letter + number" hint={mode === "signup" ? "Min 8 chars, 1 letter + 1 number" : undefined} />
          {error && <p role="alert" className="text-sm text-[var(--semantic-danger)] bg-[var(--semantic-danger)]/10 p-2 rounded-md">{error}</p>}
          <Button type="submit" loading={busy} className="w-full">
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="mt-4">
          <Button
            variant="secondary"
            className="w-full"
            onClick={async () => {
              try {
                await signInWithGoogle();
                toast("Signed in with Google", "success");
                router.replace("/onboarding");
              } catch (e) {
                toast((e as Error).message, "error");
              }
            }}
          >
            Continue with Google
          </Button>
        </div>

        {mode === "signin" && (
          <button
            onClick={async () => {
              if (!email) { setError("Enter email first to reset password"); return; }
              try { await resetPassword(email); toast("Password reset email sent", "success"); }
              catch (e) { toast((e as Error).message, "error"); }
            }}
            className="text-sm text-[var(--accent-primary)] mt-3 underline"
          >
            Forgot password?
          </button>
        )}

        <p className="text-xs text-[var(--text-tertiary)] mt-6 text-center">
          Privacy: Financial data is stored locally on this device. Only the optional AI proxy call leaves the device (see Settings).
        </p>
      </Card>
    </div>
  );
}
