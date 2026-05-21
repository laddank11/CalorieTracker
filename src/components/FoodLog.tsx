"use client";

import { LogEntry } from "@/types";
import { formatFoodName } from "@/lib/utils";

interface Props {
  entries: LogEntry[];
  onDelete: (id: number) => void;
}

const MEAL_ORDER = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

const MEAL_META: Record<string, { icon: string; accent: string; headerColor: string }> = {
  Breakfast: { icon: "🌅", accent: "border-l-amber-400",  headerColor: "text-amber-600" },
  Lunch:     { icon: "☀️", accent: "border-l-yellow-400", headerColor: "text-yellow-600" },
  Dinner:    { icon: "🌙", accent: "border-l-indigo-400", headerColor: "text-indigo-600" },
  Snack:     { icon: "🍎", accent: "border-l-emerald-400", headerColor: "text-emerald-700" },
};

function EntryCard({
  entry,
  accentClass,
  onDelete,
}: {
  entry: LogEntry;
  accentClass: string;
  onDelete: (id: number) => void;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl border border-slate-200 border-l-4 ${accentClass} hover:border-slate-300 hover:shadow-sm transition-all duration-150 group`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate leading-snug">
          {formatFoodName(entry.food_name)}
          {entry.quantity > 1 && (
            <span className="font-normal text-slate-400 ml-1.5">× {entry.quantity}</span>
          )}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 leading-snug">
          {entry.serving_size}
          <span className="mx-1.5 text-slate-300">·</span>
          <span className="text-blue-500 font-medium">P {(entry.protein * entry.quantity).toFixed(0)}g</span>
          <span className="mx-1 text-slate-200">·</span>
          <span className="text-amber-500 font-medium">C {(entry.carbs * entry.quantity).toFixed(0)}g</span>
          <span className="mx-1 text-slate-200">·</span>
          <span className="text-rose-400 font-medium">F {(entry.fat * entry.quantity).toFixed(0)}g</span>
        </p>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-sm font-bold text-emerald-600 tabular-nums">
          {Math.round(entry.calories * entry.quantity).toLocaleString()} kcal
        </span>
        <button
          onClick={() => onDelete(entry.id)}
          className="w-6 h-6 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-400 hover:bg-rose-50 active:bg-rose-100 transition-all duration-150"
          aria-label="Remove entry"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function MealGroup({
  category,
  icon,
  accent,
  headerColor,
  entries,
  onDelete,
}: {
  category: string;
  icon: string;
  accent: string;
  headerColor: string;
  entries: LogEntry[];
  onDelete: (id: number) => void;
}) {
  const groupTotal = Math.round(entries.reduce((sum, e) => sum + e.calories * e.quantity, 0));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{icon}</span>
          <span className={`text-xs font-bold uppercase tracking-widest ${headerColor}`}>{category}</span>
          <span className="text-[11px] text-slate-300 font-medium">
            {entries.length} item{entries.length !== 1 ? "s" : ""}
          </span>
        </div>
        <span className="text-xs font-bold text-slate-500 tabular-nums">{groupTotal.toLocaleString()} kcal</span>
      </div>
      <div className="space-y-2">
        {entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} accentClass={accent} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

export default function FoodLog({ entries, onDelete }: Props) {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 border-dashed py-16 flex flex-col items-center gap-2 text-center">
        <span className="text-5xl">🥗</span>
        <p className="text-sm font-bold text-slate-600 mt-2">Nothing logged yet</p>
        <p className="text-xs text-slate-400 max-w-[220px] leading-relaxed">
          Add your first meal using the panel above. Your daily progress will appear here.
        </p>
      </div>
    );
  }

  const knownOrder = MEAL_ORDER.filter((cat) => entries.some((e) => e.meal_category === cat));
  const unknownCats = [...new Set(entries.map((e) => e.meal_category))].filter(
    (c) => !MEAL_ORDER.includes(c as (typeof MEAL_ORDER)[number])
  );
  const groups = [...knownOrder, ...unknownCats].map((cat) => ({
    category: cat,
    meta: MEAL_META[cat] ?? { icon: "🍽️", accent: "border-l-slate-300", headerColor: "text-slate-600" },
    entries: entries.filter((e) => e.meal_category === cat),
  }));

  return (
    <div className="space-y-6">
      {groups.map(({ category, meta, entries: groupEntries }) => (
        <MealGroup
          key={category}
          category={category}
          icon={meta.icon}
          accent={meta.accent}
          headerColor={meta.headerColor}
          entries={groupEntries}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
