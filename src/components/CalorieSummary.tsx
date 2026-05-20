"use client";

import { DailyTotals } from "@/types";

interface Props {
  totals: DailyTotals;
}

const GOAL = 2000;
const MACRO_GOALS = { protein: 150, carbs: 250, fat: 67 };

function calorieBarColor(pct: number): string {
  if (pct < 75) return "bg-emerald-500";
  if (pct < 95) return "bg-amber-400";
  return "bg-rose-500";
}

function calorieBorderColor(pct: number): string {
  if (pct < 75) return "border-t-emerald-400";
  if (pct < 95) return "border-t-amber-400";
  return "border-t-rose-400";
}

function MacroBar({
  label,
  value,
  goal,
  color,
  dotColor,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
  dotColor: string;
}) {
  const pct = Math.min(100, (value / goal) * 100);
  const isOver = value > goal;

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
          <span className="text-xs font-semibold text-slate-500">{label}</span>
        </div>
        <span className={`text-xs font-bold tabular-nums ${isOver ? "text-rose-500" : "text-slate-700"}`}>
          {value.toFixed(0)}
          <span className="font-normal text-slate-400">/{goal}g</span>
        </span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function CalorieSummary({ totals }: Props) {
  const consumed = Math.round(totals.calories);
  const remaining = GOAL - consumed;
  const pct = Math.min(100, (consumed / GOAL) * 100);
  const isOver = consumed > GOAL;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 border-t-4 overflow-hidden ${calorieBorderColor(pct)}`}>
      <div className="p-5">
        {/* Calorie numbers row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Calories Today
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-bold text-slate-900 tabular-nums leading-none">
                {consumed.toLocaleString()}
              </span>
              <span className="text-sm font-normal text-slate-400 mb-0.5">kcal</span>
            </div>
          </div>
          <div className="text-right">
            {isOver ? (
              <>
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Over goal</p>
                <p className="text-2xl font-bold text-rose-500 tabular-nums leading-none">
                  +{Math.abs(remaining).toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">of {GOAL.toLocaleString()} kcal</p>
              </>
            ) : (
              <>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remaining</p>
                <p className="text-2xl font-bold text-slate-600 tabular-nums leading-none">
                  {remaining.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">of {GOAL.toLocaleString()} kcal</p>
              </>
            )}
          </div>
        </div>

        {/* Calorie progress bar */}
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full rounded-full transition-all duration-700 ${calorieBarColor(pct)}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Macro breakdown */}
        <div className="grid grid-cols-3 gap-5">
          <MacroBar
            label="Protein"
            value={totals.protein}
            goal={MACRO_GOALS.protein}
            color="bg-blue-500"
            dotColor="bg-blue-500"
          />
          <MacroBar
            label="Carbs"
            value={totals.carbs}
            goal={MACRO_GOALS.carbs}
            color="bg-amber-400"
            dotColor="bg-amber-400"
          />
          <MacroBar
            label="Fat"
            value={totals.fat}
            goal={MACRO_GOALS.fat}
            color="bg-rose-400"
            dotColor="bg-rose-400"
          />
        </div>
      </div>
    </div>
  );
}
