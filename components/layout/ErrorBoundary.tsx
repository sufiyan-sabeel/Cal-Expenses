"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }
  render() {
    if (this.state.hasError) {
      const cid = Math.random().toString(36).slice(2, 9).toUpperCase();
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-xl font-semibold">Something went wrong on our end</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">Correlation ID: {cid}</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Try reloading or go back to Dashboard.</p>
          <div className="flex gap-3 mt-6">
            <Button variant="primary" onClick={() => location.reload()}>Reload</Button>
            <Link href="/dashboard"><Button variant="secondary">Go to Dashboard</Button></Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
