"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface DayStat {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  entries: number;
}

const DEFAULT_GOAL = 2000;

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(localDateStr(d));
  }
  return days;
}

function shortDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function weekday(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" });
}

function barColor(calories: number, goal: number): string {
  const pct = (calories / goal) * 100;
  if (pct < 75) return "bg-emerald-400";
  if (pct < 95) return "bg-amber-400";
  return "bg-rose-500";
}

function StatusDot({ calories, goal }: { calories: number; goal: number }) {
  if (calories === 0) return <span className="w-2 h-2 rounded-full bg-slate-200 inline-block" />;
  const pct = (calories / goal) * 100;
  const color = pct < 75 ? "bg-emerald-400" : pct < 95 ? "bg-amber-400" : "bg-rose-500";
  return <span className={`w-2 h-2 rounded-full ${color} inline-block`} />;
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${accent ?? "text-slate-900"}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DayStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const { signOut } = useAuth();

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => { if (data.calorie_goal) setGoal(data.calorie_goal); });

    fetch("/api/stats?days=30")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats ?? []);
        setLoading(false);
      });
  }, []);

  const allDates = lastNDays(30);
  const byDate = Object.fromEntries(stats.map((s) => [s.date, s]));
  const days = allDates.map(
    (date) => byDate[date] ?? { date, calories: 0, protein: 0, carbs: 0, fat: 0, entries: 0 }
  );

  const logged = days.filter((d) => d.entries > 0);
  const avgCal = logged.length ? Math.round(logged.reduce((s, d) => s + d.calories, 0) / logged.length) : 0;
  const avgPro = logged.length ? Math.round(logged.reduce((s, d) => s + d.protein, 0) / logged.length) : 0;
  const onTrack = logged.filter((d) => d.calories <= goal).length;
  const totalCal = Math.round(days.reduce((s, d) => s + d.calories, 0));

  const chartMax = Math.max(goal * 1.3, ...days.map((d) => d.calories));
  const goalPct = (goal / chartMax) * 100;

  // Label every 5th bar
  const labelEvery = 5;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f6f8" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Today
            </Link>
            <span className="text-slate-200">|</span>
            <span className="font-bold text-slate-900">Monthly History</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:block">Last 30 days</span>
            <button onClick={signOut} className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6" suppressHydrationWarning>
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Avg Daily"
            value={avgCal ? `${avgCal.toLocaleString()}` : "—"}
            sub="kcal / logged day"
            accent={avgCal > goal ? "text-rose-500" : "text-slate-900"}
          />
          <StatCard
            label="Days Logged"
            value={`${logged.length}`}
            sub={`of 30 days`}
          />
          <StatCard
            label="On Track"
            value={`${onTrack}`}
            sub="days at or under goal"
            accent="text-emerald-600"
          />
          <StatCard
            label="Total Calories"
            value={totalCal ? `${(totalCal / 1000).toFixed(1)}k` : "—"}
            sub="last 30 days"
          />
        </div>

        {/* Calorie chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calorie Trend</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">Last 30 days</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /> Under goal</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Near goal</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" /> Over goal</span>
            </div>
          </div>

          {loading ? (
            <div className="h-40 flex items-end gap-1 animate-pulse">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-slate-100 rounded-t-sm"
                  style={{ height: `${20 + Math.random() * 60}%` }}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1 px-1">
              <div className="relative" style={{ minWidth: "540px" }}>
                {/* Goal line */}
                <div
                  className="absolute left-0 right-0 flex items-center gap-1 pointer-events-none"
                  style={{ bottom: `calc(${goalPct}% + 24px)` }}
                >
                  <div className="flex-1 border-t border-dashed border-slate-300" />
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">Goal</span>
                </div>

                {/* Bars */}
                <div className="flex items-end gap-1 h-40">
                  {days.map((day, i) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-10">
                        <div className="bg-slate-800 text-white text-[11px] font-semibold px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                          {shortDate(day.date)}: {day.calories > 0 ? `${day.calories.toLocaleString()} kcal` : "No log"}
                        </div>
                        <div className="w-1.5 h-1.5 bg-slate-800 rotate-45 -mt-1" />
                      </div>

                      {/* Bar */}
                      <div
                        className={`w-full rounded-t-sm transition-all duration-300 ${
                          day.entries === 0 ? "bg-slate-100" : barColor(day.calories, goal)
                        }`}
                        style={{
                          height: `${Math.max(day.entries === 0 ? 4 : 6, (day.calories / chartMax) * 100)}%`,
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* X-axis labels — every 5th day */}
                <div className="flex items-start gap-1 mt-1">
                  {days.map((day, i) => (
                    <div key={day.date} className="flex-1 text-center">
                      {i % labelEvery === 0 ? (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {shortDate(day.date)}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Day-by-day table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Breakdown</p>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-px">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-50" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Date</span>
                <span className="text-right">Calories</span>
                <span className="text-right hidden sm:block">Protein</span>
                <span className="text-right hidden sm:block">Carbs</span>
                <span className="text-right hidden sm:block">Fat</span>
                <span className="text-right">Items</span>
              </div>

              {/* Rows — newest first */}
              {[...days].reverse().map((day) => {
                const isEmpty = day.entries === 0;
                const isToday = day.date === localDateStr(new Date());
                return (
                  <div
                    key={day.date}
                    className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 text-sm transition-colors ${
                      isEmpty ? "opacity-40" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusDot calories={day.calories} goal={goal} />
                      <span className="font-semibold text-slate-700 truncate">
                        {shortDate(day.date)}
                        {isToday && (
                          <span className="ml-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            Today
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-slate-400 hidden sm:inline">{weekday(day.date)}</span>
                    </div>
                    <span className={`text-right font-bold tabular-nums ${
                      isEmpty ? "text-slate-300" :
                      day.calories > goal ? "text-rose-500" : "text-emerald-600"
                    }`}>
                      {isEmpty ? "—" : day.calories.toLocaleString()}
                    </span>
                    <span className="text-right text-blue-500 font-medium tabular-nums hidden sm:block">
                      {isEmpty ? "—" : `${day.protein}g`}
                    </span>
                    <span className="text-right text-amber-500 font-medium tabular-nums hidden sm:block">
                      {isEmpty ? "—" : `${day.carbs}g`}
                    </span>
                    <span className="text-right text-rose-400 font-medium tabular-nums hidden sm:block">
                      {isEmpty ? "—" : `${day.fat}g`}
                    </span>
                    <span className="text-right text-slate-400 tabular-nums">
                      {isEmpty ? "—" : day.entries}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
