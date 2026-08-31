"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GamesPage() {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [quizIdx, setQuizIdx] = useState(0);
  const quizzes = [
    { q: "If your Food budget is ₹4000 and you spent ₹3200, what's utilization?", opts: ["70%", "80%", "90%"], ans: 1 },
    { q: "Current Balance = Starting + Income − ?", opts: ["Expenses", "Gifts", "Loans"], ans: 0 },
    { q: "Which action needs confirmation?", opts: ["View analytics", "Delete all transactions", "Add expense ₹250"], ans: 1 },
  ];
  const q = quizzes[quizIdx % quizzes.length]!;
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-semibold">Games — Learn (optional)</h1>
      <p className="text-sm text-[var(--text-secondary)]">Lightweight educational games. No gambling, no paid rewards, no loot boxes. Clearly separated from core finance.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><h4 className="font-medium">Budget Challenge</h4><p className="text-xs text-[var(--text-tertiary)]">Stay under budget for 7 days</p><div className="text-2xl font-bold mt-2">{streak} days</div><Button size="sm" className="mt-2" onClick={() => setStreak((v) => v + 1)}>+ Mark day</Button><Button size="sm" variant="ghost" onClick={() => setStreak(0)}>Reset</Button></Card>
        <Card><h4 className="font-medium">Savings Streak</h4><p className="text-xs text-[var(--text-tertiary)]">Save daily</p><div className="text-2xl font-bold mt-2">₹{score}</div><Button size="sm" className="mt-2" onClick={() => setScore((v) => v + 100)}>Save ₹100</Button></Card>
        <Card><h4 className="font-medium">Expense Quiz</h4><p className="text-sm mt-1">{q.q}</p><div className="flex flex-col gap-2 mt-2">{q.opts.map((o, i) => <Button key={o} size="sm" variant="secondary" onClick={() => { if (i === q.ans) { setScore((s) => s + 10); alert("Correct! +10"); } else alert("Try again"); setQuizIdx((v) => v + 1); }}>{o}</Button>)}</div></Card>
      </div>
    </div>
  );
}
