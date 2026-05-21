"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import CalorieSummary from "@/components/CalorieSummary";
import FoodSearch from "@/components/FoodSearch";
import QuickAdd from "@/components/QuickAdd";
import FoodLog from "@/components/FoodLog";
import AITextInput from "@/components/AITextInput";
import AIImageUpload from "@/components/AIImageUpload";
import { Food, LogEntry, DailyTotals, NutritionItem } from "@/types";

type Tab = "search" | "describe" | "photo" | "quickadd";
type MealCategory = "Breakfast" | "Lunch" | "Dinner" | "Snack";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "search",   label: "Search",    icon: "🔍" },
  { id: "describe", label: "Describe",  icon: "✍️" },
  { id: "photo",    label: "Photo",     icon: "📷" },
  { id: "quickadd", label: "Quick Add", icon: "⚡" },
];

const MEAL_CATEGORIES: { id: MealCategory; label: string; icon: string }[] = [
  { id: "Breakfast", label: "Breakfast", icon: "🌅" },
  { id: "Lunch",     label: "Lunch",     icon: "☀️" },
  { id: "Dinner",    label: "Dinner",    icon: "🌙" },
  { id: "Snack",     label: "Snack",     icon: "🍎" },
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function defaultCategory(): MealCategory {
  const h = new Date().getHours();
  if (h < 10) return "Breakfast";
  if (h < 14) return "Lunch";
  if (h < 19) return "Dinner";
  return "Snack";
}

function computeTotals(entries: LogEntry[]): DailyTotals {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories * e.quantity,
      protein:  acc.protein  + e.protein  * e.quantity,
      carbs:    acc.carbs    + e.carbs    * e.quantity,
      fat:      acc.fat      + e.fat      * e.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function LogSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[62px] bg-white rounded-xl border border-slate-200" />
      ))}
    </div>
  );
}

export default function Home() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("search");
  const [selectedCategory, setSelectedCategory] = useState<MealCategory>(defaultCategory);
  const [isLoading, setIsLoading] = useState(true);
  const date = today();

  const fetchLog = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/log?date=${date}`);
      const data = await res.json();
      setEntries(data.entries ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  async function addFood(food: Food, quantity = 1) {
    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        food_name:     food.name,
        calories:      food.calories,
        protein:       food.protein,
        carbs:         food.carbs,
        fat:           food.fat,
        serving_size:  food.servingSize,
        quantity,
        date,
        meal_category: selectedCategory,
      }),
    });
    fetchLog();
  }

  async function addNutritionItem(item: NutritionItem) {
    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        food_name:     item.name,
        calories:      item.calories,
        protein:       item.protein,
        carbs:         item.carbs,
        fat:           item.fat,
        serving_size:  item.servingSize,
        quantity:      item.quantity,
        date,
        meal_category: selectedCategory,
      }),
    });
    fetchLog();
  }

  async function deleteEntry(id: number) {
    const res = await fetch(`/api/log/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  }

  async function clearLog() {
    if (!confirm("Delete all entries for today? This cannot be undone.")) return;
    await fetch(`/api/log?date=${date}`, { method: "DELETE" });
    setEntries([]);
  }

  const totals = computeTotals(entries);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f6f8" }}>
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2C6.5 2 4 5 4 8c0 4 6 10 6 10s6-6 6-10c0-3-2.5-6-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">NutriTrack</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-slate-400 hover:text-emerald-600 transition-colors hidden sm:block"
            >
              History
            </Link>
            <span className="text-sm text-slate-500 hidden sm:block">{formatDate(date)}</span>
            <span className="text-sm font-medium text-slate-500 sm:hidden">
              {new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Calorie Summary */}
        <div className="fade-up fade-up-1">
          <CalorieSummary totals={totals} />
        </div>

        {/* Add Food Panel */}
        <div className="fade-up fade-up-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Meal category selector */}
          <div className="px-5 pt-5 pb-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Adding to
            </p>
            <div className="flex gap-2 flex-wrap">
              {MEAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
                    ${selectedCategory === cat.id
                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                    }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100 mx-5" />

          {/* Tab bar */}
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-[11px] font-bold tracking-wide transition-all duration-150 flex items-center justify-center gap-1.5
                  ${activeTab === tab.id
                    ? "text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50"
                    : "text-slate-400 hover:text-slate-600 border-b-2 border-transparent hover:bg-slate-50"
                  }`}
              >
                <span className="hidden sm:inline text-sm">{tab.icon}</span>
                <span className="uppercase">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {activeTab === "search"   && <FoodSearch onAdd={addFood} />}
            {activeTab === "describe" && <AITextInput onAdd={addNutritionItem} />}
            {activeTab === "photo"    && <AIImageUpload onAdd={addNutritionItem} />}
            {activeTab === "quickadd" && <QuickAdd onAdd={addFood} />}
          </div>
        </div>

        {/* Food Log */}
        <div className="fade-up fade-up-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Today&apos;s Log
              </h2>
              {entries.length > 0 && (
                <span className="text-[11px] bg-slate-200 text-slate-500 font-semibold px-2 py-0.5 rounded-full">
                  {entries.length} item{entries.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            {entries.length > 0 && (
              <button
                onClick={clearLog}
                className="text-xs font-semibold text-rose-400 hover:text-rose-600 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          {isLoading ? (
            <LogSkeleton />
          ) : (
            <FoodLog entries={entries} onDelete={deleteEntry} />
          )}
        </div>
      </main>
    </div>
  );
}
