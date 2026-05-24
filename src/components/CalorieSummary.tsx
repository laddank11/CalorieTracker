"use client";

import { useState } from "react";
import { DailyTotals } from "@/types";

interface Props {
  totals: DailyTotals;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  onGoalChange: (key: "calorie_goal" | "protein_goal" | "carbs_goal" | "fat_goal", value: number) => void;
}

function calorieBarColor(pct: number) {
  if (pct < 75) return "bg-emerald-500";
  if (pct < 95) return "bg-amber-400";
  return "bg-rose-500";
}

function calorieBorderColor(pct: number) {
  if (pct < 75) return "border-t-emerald-400";
  if (pct < 95) return "border-t-amber-400";
  return "border-t-rose-400";
}

// Recommended macros based on calorie goal using standard macro split (30/45/25)
function recommended(calorieGoal: number) {
  return {
    protein: Math.round((calorieGoal * 0.30) / 4),
    carbs:   Math.round((calorieGoal * 0.45) / 4),
    fat:     Math.round((calorieGoal * 0.25) / 9),
  };
}

function InlineEdit({
  value,
  min,
  max,
  unit,
  recommendedValue,
  onCommit,
  onCancel,
}: {
  value: number;
  min: number;
  max: number;
  unit: string;
  recommendedValue: number;
  onCommit: (n: number) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(String(value));

  function commit() {
    const n = parseInt(draft);
    if (!isNaN(n) && n >= min && n <= max) onCommit(n);
    else onCancel();
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") onCancel(); }}
          onBlur={commit}
          className="w-20 text-xs text-center border border-emerald-400 rounded-lg px-2 py-0.5 font-bold tabular-nums outline-none bg-white"
        />
        <span className="text-[11px] text-slate-400">{unit}</span>
      </div>
      <span className="text-[10px] text-slate-400">Rec: {recommendedValue}{unit}</span>
    </div>
  );
}

function MacroBar({
  label,
  value,
  goal,
  recommendedValue,
  color,
  dotColor,
  onGoalChange,
}: {
  label: string;
  value: number;
  goal: number;
  recommendedValue: number;
  color: string;
  dotColor: string;
  onGoalChange: (n: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const pct = Math.min(100, (value / goal) * 100);
  const isOver = value > goal;

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />
          <span className="text-xs font-semibold text-slate-500">{label}</span>
        </div>
        {editing ? (
          <InlineEdit
            value={goal}
            min={10}
            max={1000}
            unit="g"
            recommendedValue={recommendedValue}
            onCommit={(n) => { onGoalChange(n); setEditing(false); }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className={`text-xs font-bold tabular-nums group flex items-center gap-0.5 ${isOver ? "text-rose-500" : "text-slate-700"}`}
          >
            {value.toFixed(0)}
            <span className="font-normal text-slate-400 group-hover:text-emerald-500 transition-colors">
              /{goal}g
            </span>
            <span className="opacity-0 group-hover:opacity-50 text-[9px] text-slate-400 transition-opacity">✏</span>
          </button>
        )}
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

export default function CalorieSummary({ totals, calorieGoal, proteinGoal, carbsGoal, fatGoal, onGoalChange }: Props) {
  const [editingCalories, setEditingCalories] = useState(false);

  const consumed = Math.round(totals.calories);
  const remaining = calorieGoal - consumed;
  const pct = Math.min(100, (consumed / calorieGoal) * 100);
  const isOver = consumed > calorieGoal;
  const rec = recommended(calorieGoal);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 border-t-4 overflow-hidden ${calorieBorderColor(pct)}`}>
      <div className="p-5">
        {/* Calorie row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Calories Today</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-bold text-slate-900 tabular-nums leading-none">{consumed.toLocaleString()}</span>
              <span className="text-sm font-normal text-slate-400 mb-0.5">kcal</span>
            </div>
          </div>

          <div className="text-right">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isOver ? "text-rose-400" : "text-slate-400"}`}>
              {isOver ? "Over goal" : "Remaining"}
            </p>
            <p className={`text-2xl font-bold tabular-nums leading-none ${isOver ? "text-rose-500" : "text-slate-600"}`}>
              {isOver ? "+" : ""}{Math.abs(remaining).toLocaleString()}
            </p>

            {editingCalories ? (
              <InlineEdit
                value={calorieGoal}
                min={500}
                max={10000}
                unit="kcal"
                recommendedValue={2000}
                onCommit={(n) => { onGoalChange("calorie_goal", n); setEditingCalories(false); }}
                onCancel={() => setEditingCalories(false)}
              />
            ) : (
              <button
                onClick={() => setEditingCalories(true)}
                className="text-[11px] text-slate-400 mt-1 hover:text-emerald-500 transition-colors group text-right flex items-center gap-0.5 ml-auto"
              >
                of {calorieGoal.toLocaleString()} kcal
                <span className="opacity-0 group-hover:opacity-60 text-[10px] transition-opacity">✏</span>
              </button>
            )}
          </div>
        </div>

        {/* Calorie bar */}
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-6">
          <div className={`h-full rounded-full transition-all duration-700 ${calorieBarColor(pct)}`} style={{ width: `${pct}%` }} />
        </div>

        {/* Macro bars */}
        <div className="grid grid-cols-3 gap-5">
          <MacroBar
            label="Protein"
            value={totals.protein}
            goal={proteinGoal}
            recommendedValue={rec.protein}
            color="bg-blue-500"
            dotColor="bg-blue-500"
            onGoalChange={(n) => onGoalChange("protein_goal", n)}
          />
          <MacroBar
            label="Carbs"
            value={totals.carbs}
            goal={carbsGoal}
            recommendedValue={rec.carbs}
            color="bg-amber-400"
            dotColor="bg-amber-400"
            onGoalChange={(n) => onGoalChange("carbs_goal", n)}
          />
          <MacroBar
            label="Fat"
            value={totals.fat}
            goal={fatGoal}
            recommendedValue={rec.fat}
            color="bg-rose-400"
            dotColor="bg-rose-400"
            onGoalChange={(n) => onGoalChange("fat_goal", n)}
          />
        </div>
      </div>
    </div>
  );
}
