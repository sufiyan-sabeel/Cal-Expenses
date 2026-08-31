"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
      <Logo variant="icon" size="xl" />
      <h1 className="text-xl font-semibold mt-4">CAL-EXPENSES</h1>
      <p className="text-sm text-[var(--text-secondary)] mt-2">Your money. Your days. One calendar.</p>
      <p className="text-xs text-[var(--text-tertiary)] mt-4">Redirecting to dashboard…</p>
      <a href="/Cal-Expenses/dashboard/" className="mt-4 text-sm text-[var(--accent-primary)] underline">
        Go to Dashboard →
      </a>
      <noscript>
        <p className="text-sm mt-4">
          <a href="/Cal-Expenses/dashboard/">Continue to Dashboard</a>
        </p>
      </noscript>
    </div>
  );
}
