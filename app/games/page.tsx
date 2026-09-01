"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";

function StreakDots({ streak, max = 7 }: { streak: number; max?: number }) {
  return (
    <div className="flex items-center gap-1.5" role="img" aria-label={`Streak ${streak} of ${max} days`}>
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className="h-3 w-3 rounded-full border"
          style={{
            borderRadius: "var(--radius-full)",
            background: i < streak ? "var(--color-goal)" : "var(--color-surface-hover)",
            borderColor: i < streak ? "var(--color-goal)" : "var(--color-border)",
            transition: "background var(--motion-duration-base) var(--motion-easing-standard)",
          }}
          aria-hidden
        />
      ))}
      <span className="ml-1 text-xs font-medium tabular-nums" style={{ color: "var(--color-text-secondary)" }}>{streak}/{max}</span>
    </div>
  );
}

function SkeletonGames() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[0,1,2].map(i => <div key={i} className="skeleton h-48 w-full" style={{ borderRadius: "var(--radius-md)"}} />)}
    </div>
  );
}

export default function GamesPage() {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [quizIdx, setQuizIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);

  const quizzes = [
    { q: "If your Food budget is ₹4000 and you spent ₹3200, what's utilization?", opts: ["70%", "80%", "90%"], ans: 1, hint: "3200/4000 = 0.8" },
    { q: "Current Balance = Starting + Income − ?", opts: ["Expenses", "Gifts", "Loans"], ans: 0, hint: "Balance subtracts all expenses to date" },
    { q: "Which action needs explicit confirmation?", opts: ["View analytics", "Delete all local data", "Open calendar"], ans: 1, hint: "Destructive actions need two-step confirm" },
    { q: "A savings goal pulsing at 50% is what kind of feedback?", opts: ["Gambling reveal", "Restrained milestone pulse", "Confetti burst"], ans: 1, hint: "Single restrained pulse per §27" },
  ];
  const q = quizzes[quizIdx % quizzes.length]!;

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="skeleton h-8 w-40" style={{ borderRadius: "var(--radius-xs)"}} />
        <SkeletonGames />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-bold tracking-tight flex items-center gap-2" style={{ fontSize: "var(--font-size-h1)", color: "var(--color-text-primary)" }}><Icon name="games" size={22} /> Games — Learn</h1>
        <p className="mt-1" style={{ fontSize: "var(--font-size-body-sm)", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
          Lightweight educational games — visually consistent with the core app, no separate “game skin.” No gambling, no paid rewards, no loot boxes. Clearly separated from core finance.
        </p>
      </div>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 border p-3" style={{ borderRadius: "var(--radius-md)", background: "var(--color-error-bg)", borderColor: "var(--color-error)", color: "var(--color-error)" }}>
          <span className="text-sm font-medium">{error}</span>
          <Button variant="secondary" size="sm" onClick={() => setError(null)}>Dismiss</Button>
        </div>
      )}

      {/* Empty state when no interaction yet */}
      {(score === 0 && streak === 0) && (
        <Card className="text-center" style={{ borderRadius: "var(--radius-md)", padding: "var(--space-6)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)", background: "var(--color-surface)", borderStyle: "dashed" }}>
          <div className="mx-auto h-9 w-9 rounded-full bg-[var(--color-surface-hover)] grid place-items-center text-[var(--color-text-muted)]"><Icon name="sparkles" size={18} /></div>
          <h4 className="font-semibold mt-3" style={{ fontSize: "var(--font-size-h4)" }}>Learn by playing</h4>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>Try the Budget Challenge, Savings Streak or Expense Quiz below — streaks are shown as simple dots, not flames.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {/* Budget Challenge — savings-themed => goal accent */}
        <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)", borderTop: "3px solid var(--color-goal)" }}>
          <CardHeader className="mb-2">
            <CardTitle className="flex items-center gap-2" style={{ fontSize: "var(--font-size-h4)" }}><span className="h-7 w-7 rounded-full grid place-items-center" style={{ background: "var(--color-goal-bg)", color: "var(--color-goal)" }}><Icon name="target" size={14} /></span> Budget Challenge</CardTitle>
          </CardHeader>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Stay under budget for 7 days — gentle daily habit, no urgency styling.</p>
          <div className="mt-4">
            <StreakDots streak={streak} max={7} />
          </div>
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden" style={{ borderRadius: "var(--radius-full)", background: "var(--color-surface-hover)" }}>
              <div className="h-full" style={{ width: `${Math.min((streak / 7) * 100, 100)}%`, background: "var(--color-goal)", borderRadius: "var(--radius-full)", transition: "width var(--motion-duration-base) var(--motion-easing-standard)" }} role="progressbar" aria-valuenow={streak} aria-valuemin={0} aria-valuemax={7} />
            </div>
            <div className="flex justify-between mt-1" style={{ fontSize: "var(--font-size-caption)", color: "var(--color-text-muted)" }}>
              <span>{streak} days</span><span>Goal: 7</span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={() => { if (streak >= 7) setError("Challenge complete — reset to start again."); else setStreak((v) => Math.min(v + 1, 7)); }} style={{ minHeight: 44 }} aria-label="Mark day complete"><Icon name="add" size={14} /> Mark day</Button>
            <Button size="sm" variant="secondary" onClick={() => setStreak(0)} style={{ minHeight: 44 }}>Reset</Button>
          </div>
          {streak === 7 && <p className="text-xs font-medium mt-2 inline-flex items-center gap-1 px-2 py-1" style={{ borderRadius: "var(--radius-full)", background: "var(--color-goal-bg)", color: "var(--color-goal)" }}><Icon name="sparkles" size={12} /> Challenge complete</p>}
        </Card>

        {/* Savings Streak — also goal accent */}
        <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)", borderTop: "3px solid var(--color-goal)" }}>
          <CardHeader className="mb-2">
            <CardTitle className="flex items-center gap-2" style={{ fontSize: "var(--font-size-h4)" }}><span className="h-7 w-7 rounded-full grid place-items-center" style={{ background: "var(--color-goal-bg)", color: "var(--color-goal)" }}><Icon name="wallet" size={14} /></span> Savings Streak</CardTitle>
          </CardHeader>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Save daily — dots show consecutive days, no slot-machine styling.</p>
          <div className="mt-3 font-bold tabular-nums" style={{ fontSize: "var(--font-size-financial-md)", color: "var(--color-text-primary)" }}>₹{score.toFixed(0)}</div>
          <div className="mt-2">
            <StreakDots streak={Math.min(Math.floor(score / 100), 7)} max={7} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={() => setScore((v) => v + 100)} style={{ minHeight: 44 }} aria-label="Save 100 rupees">Save ₹100</Button>
            <Button size="sm" variant="ghost" onClick={() => setScore(0)} style={{ minHeight: 44 }}>Reset</Button>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>Score is illustrative only — not real money or wagering.</p>
        </Card>

        {/* Expense Quiz — knowledge-themed => ai accent per §37 */}
        <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)", borderTop: "3px solid var(--color-ai)" }}>
          <CardHeader className="mb-2">
            <CardTitle className="flex items-center gap-2" style={{ fontSize: "var(--font-size-h4)" }}><span className="h-7 w-7 rounded-full grid place-items-center" style={{ background: "var(--color-ai-bg)", color: "var(--color-ai)" }}><Icon name="ai" size={14} /></span> Expense Quiz</CardTitle>
          </CardHeader>
          <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)", lineHeight: "1.4" }}>{q.q}</p>
          <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{q.hint}</p>
          <div className="flex flex-col gap-2 mt-3">
            {q.opts.map((o, i) => (
              <Button
                key={o}
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (i === q.ans) { setScore((s) => s + 10); setLastResult("correct"); } else { setLastResult("wrong"); }
                  setTimeout(() => setQuizIdx((v) => v + 1), 600);
                }}
                style={{ minHeight: 44, justifyContent: "flex-start" }}
                aria-label={`Answer ${o}`}
              >{o}</Button>
            ))}
          </div>
          {lastResult && (
            <div className="mt-3 text-xs font-medium flex items-center gap-1.5" style={{ color: lastResult === "correct" ? "var(--color-income)" : "var(--color-error)" }}>
              <Icon name={lastResult === "correct" ? "trendingUp" : "trendingDown"} size={12} /> {lastResult === "correct" ? "Correct! +10" : "Try again — next question queued"}
            </div>
          )}
          <div className="mt-3 flex items-center gap-1.5" style={{ fontSize: "var(--font-size-caption)", color: "var(--color-text-muted)" }}>
            <span>Progress</span>
            <div className="flex-1 h-1.5 overflow-hidden" style={{ borderRadius: "var(--radius-full)", background: "var(--color-surface-hover)" }}>
              <div className="h-full" style={{ width: `${((quizIdx % quizzes.length) / quizzes.length) * 100}%`, background: "var(--color-ai)", borderRadius: "var(--radius-full)" }} />
            </div>
            <span className="tabular-nums">{quizIdx + 1} / {quizzes.length}</span>
          </div>
        </Card>
      </div>

      <Card style={{ borderRadius: "var(--radius-md)", padding: "var(--space-4)", boxShadow: "var(--elevation-1)", borderColor: "var(--color-border)", background: "var(--color-surface-hover)" }}>
        <h4 className="font-semibold flex items-center gap-2" style={{ fontSize: "var(--font-size-h4)" }}><Icon name="settings" size={14} /> How games stay calm</h4>
        <ul className="list-disc pl-5 mt-2 space-y-1" style={{ fontSize: "var(--font-size-body-sm)", color: "var(--color-text-secondary)" }}>
          <li>No confetti beyond a single restrained pulse on milestones; no slot-style reveals, wheels, coins or wagering.</li>
          <li>Streaks use filled/unfilled dots — not flames or currency.</li>
          <li>Separate from core finance — does not affect balance, budgets or reports.</li>
        </ul>
      </Card>
    </div>
  );
}
