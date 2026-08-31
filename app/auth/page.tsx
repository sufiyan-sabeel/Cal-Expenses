"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/components/ui/toast";
import { Logo } from "@/components/ui/logo";

export default function AuthPage() {
  const { user, loading, signIn, signUp, signInWithGoogle, resetPassword, isConfigured } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      const raw = typeof window !== "undefined" ? localStorage.getItem("calexpenses:v1:profile") : null;
      const profile = raw ? JSON.parse(raw) : null;
      if (profile?.onboardingCompleted) router.replace("/dashboard");
      else router.replace("/onboarding");
    }
  }, [user, loading, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[var(--surface-canvas)]"><div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" /></div>;
  if (user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signin") await signIn(email, password);
      else await signUp(email, password, name);
      toast(mode === "signin" ? "Signed in successfully" : "Account created — welcome!", "success");
      router.replace("/onboarding");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
      toast(msg, "error");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
      toast("Signed in with Google", "success");
      router.replace("/onboarding");
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Google sign-in failed";
      let friendly = raw;
      if (raw.includes("auth/unauthorized-domain")) friendly = "This domain is not authorized in Firebase. In Firebase Console → Authentication → Settings → Authorized domains, add 'sufiyan-sabeel.github.io' and 'cal-expenses.firebaseapp.com'.";
      else if (raw.includes("auth/popup-blocked")) friendly = "Popup blocked. Please allow popups for this site and try again.";
      else if (raw.includes("auth/popup-closed-by-user")) friendly = "Popup closed before completing sign-in.";
      else if (raw.includes("auth/operation-not-allowed")) friendly = "Google sign-in is not enabled. In Firebase Console → Authentication → Sign-in method, enable Google.";
      else if (raw.includes("requires Firebase configuration")) friendly = raw;
      setError(friendly);
      toast(friendly, "error");
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleReset = async () => {
    if (!email) { setError("Enter your email above first, then click Forgot password."); return; }
    try { await resetPassword(email); toast("Password reset email sent — check your inbox", "success"); }
    catch (e) { const m = e instanceof Error ? e.message : "Reset failed"; setError(m); toast(m, "error"); }
  };

  return (
    <div className="min-h-screen w-full flex bg-[var(--surface-canvas)] antialiased">
      {/* Left branding — 40% desktop */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-[#0B0B0C] p-10 xl:p-12 text-white relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center gap-3 mb-14">
            <Logo variant="icon" size="md" className="" />
            <span className="text-[11px] tracking-[0.12em] font-semibold opacity-60 uppercase">Wallet & Calendar</span>
          </div>
          <div className="max-w-[420px]">
            <h1 className="font-display text-[42px] leading-[1.05] font-bold">
              Your money.<br />Your days.<br /><span className="text-[var(--accent-primary)]">One calendar.</span>
            </h1>
            <p className="text-gray-400 text-[15px] leading-relaxed mt-5 max-w-[360px]">
              A premium, calm approach to personal finance. Minimalist tracking meets calendar clarity — private, local-first.
            </p>
            <div className="mt-8 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15">No cloud DB</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15">PWA offline</span>
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15">₹ INR</span>
            </div>
          </div>
        </div>
        <div className="z-10 flex items-center gap-2 text-gray-500 text-xs">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M7 7V5a5 5 0 0 1 10 0v2" /></svg>
          Local-only. No database. Your data never leaves your device.
        </div>
        {/* decorative blur */}
        <div className="absolute -top-[18%] -right-[10%] w-[68%] h-[68%] rounded-full bg-[var(--accent-primary)] blur-[110px] opacity-[0.18] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[8%] right-[12%] w-[36%] h-[18%] rounded-full bg-[#1F9D6B] blur-[70px] opacity-[0.12] mix-blend-screen pointer-events-none" />
      </div>

      {/* Right form — 60% */}
      <div className="w-full lg:w-[58%] bg-[var(--surface-elevated-1)] flex flex-col justify-center items-center p-6 sm:p-8 lg:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8 w-full max-w-md">
          <Logo variant="icon" size="md" />
          <div className="flex flex-col">
            <span className="font-semibold tracking-[-0.02em] leading-none">CAL-EXPENSES</span>
            <span className="text-[11px] tracking-wide text-[var(--text-tertiary)]">Wallet & Calendar</span>
          </div>
        </div>

        <div className="w-full max-w-[420px]">
          <div className="mb-7 text-center sm:text-left">
            <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{mode === "signin" ? "Welcome back" : "Create account"}</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{mode === "signin" ? "Enter your details to access your dashboard." : "Start your private, local-first finance journey."}</p>
            {!isConfigured && (
              <div className="mt-3 text-xs px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
                Firebase not configured — running in local demo mode. Email/password works locally without cloud.
              </div>
            )}
          </div>

          {/* Tabs — pill */}
          <div className="flex bg-[var(--surface-elevated-2)] p-1 rounded-md mb-6">
            <button onClick={() => { setMode("signin"); setError(null); }} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "signin" ? "bg-[var(--surface-elevated-1)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>Sign in</button>
            <button onClick={() => { setMode("signup"); setError(null); }} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === "signup" ? "bg-[var(--surface-elevated-1)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>Sign up</button>
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="name">Display name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-tertiary)]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>
                  </span>
                  <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="block w-full pl-10 pr-3 h-11 border border-[var(--border-subtle)] rounded-md bg-[var(--surface-elevated-1)] text-[15px] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="email">Email address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-tertiary)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 6h16v12H4z" /><path d="M4 7l8 6 8-6" /></svg>
                </span>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="block w-full pl-10 pr-3 h-11 border border-[var(--border-subtle)] rounded-md bg-[var(--surface-elevated-1)] text-[15px] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--text-primary)]" htmlFor="password">Password</label>
                {mode === "signin" && (
                  <button type="button" onClick={handleReset} className="text-sm font-medium text-[var(--accent-primary)] hover:opacity-80">Forgot password?</button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-tertiary)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M7 7V5a5 5 0 0 1 10 0v2" /><circle cx="12" cy="13" r="2" /></svg>
                </span>
                <input id="password" type={showPass ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === "signin" ? "current-password" : "new-password"} className="block w-full pl-10 pr-10 h-11 border border-[var(--border-subtle)] rounded-md bg-[var(--surface-elevated-1)] text-[15px] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent" />
                <button type="button" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                  {showPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 3l18 18" /><path d="M10.5 10.5a3 3 0 0 0 3 3" /><path d="M9.9 5.1A10.7 10.7 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-2.6 3.6" /><path d="M14.1 14.1A4 4 0 0 1 12 16c-6 0-10-7-10-7a17 17 0 0 1 3.2-3.9" /></svg>
                  )}
                </button>
              </div>
              {mode === "signup" && <p className="text-xs text-[var(--text-tertiary)]">Min 8 chars, at least 1 letter + 1 number</p>}
            </div>

            {error && (
              <div role="alert" className="text-sm text-[var(--semantic-danger)] bg-[var(--semantic-danger)]/10 border border-[var(--semantic-danger)]/20 px-3 py-2.5 rounded-md flex gap-2">
                <span aria-hidden className="mt-0.5">⚠</span>
                <span className="flex-1 leading-snug">{error}</span>
              </div>
            )}

            <button type="submit" disabled={busy} className="w-full h-11 rounded-md bg-[var(--accent-primary)] text-white text-sm font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-primary)] disabled:opacity-50 flex items-center justify-center gap-2">
              {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border-subtle)]" /></div>
            <div className="relative flex justify-center"><span className="px-3 bg-[var(--surface-elevated-1)] text-xs tracking-widest font-medium text-[var(--text-tertiary)] uppercase">Or</span></div>
          </div>

          <button onClick={handleGoogle} disabled={googleBusy} className="w-full h-11 rounded-md border border-[var(--border-strong)] bg-[var(--surface-elevated-1)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-elevated-2)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--border-strong)] flex items-center justify-center gap-2.5 disabled:opacity-50">
            {googleBusy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--text-primary)] border-t-transparent" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            )}
            Continue with Google
          </button>

          <p className="text-xs text-[var(--text-tertiary)] mt-6 text-center leading-relaxed">
            Privacy: Financial data is stored locally on this device. Only the optional AI proxy call leaves the device. {mode === "signin" && "Don’t have an account? Switch to Sign up above."}
          </p>
        </div>
      </div>
    </div>
  );
}
