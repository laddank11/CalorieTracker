"use client";

import { useState } from "react";
import { NutritionItem, NutritionAnalysis } from "@/types";

interface Props {
  onAdd: (item: NutritionItem) => void;
}

function ItemCard({ item, onAdd }: { item: NutritionItem; onAdd: (i: NutritionItem) => void }) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    onAdd(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="font-semibold text-slate-800 text-sm truncate">{item.name}</p>
          {item.quantity > 1 && (
            <span className="text-xs text-slate-400 shrink-0">× {item.quantity}</span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          <span className="text-blue-500 font-medium">P {(item.protein * item.quantity).toFixed(0)}g</span>
          <span className="mx-1 text-slate-300">·</span>
          <span className="text-amber-500 font-medium">C {(item.carbs * item.quantity).toFixed(0)}g</span>
          <span className="mx-1 text-slate-300">·</span>
          <span className="text-rose-400 font-medium">F {(item.fat * item.quantity).toFixed(0)}g</span>
          <span className="mx-1.5 text-slate-200">·</span>
          {item.servingSize}
        </p>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-sm font-bold text-emerald-600">
          {Math.round(item.calories * item.quantity)} kcal
        </span>
        <button
          onClick={handleAdd}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200
            ${added
              ? "bg-emerald-100 text-emerald-700"
              : "bg-emerald-500 hover:bg-emerald-600 text-white"
            }`}
        >
          {added ? "✓" : "+"}
        </button>
      </div>
    </div>
  );
}

export default function AITextInput({ onAdd }: Props) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<NutritionItem[]>([]);

  async function analyze() {
    const trimmed = description.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const res = await fetch("/api/ai/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: trimmed }),
      });
      const data: NutritionAnalysis = await res.json();
      if (!data.items?.length) {
        setError("Couldn't identify any foods. Try rephrasing your description.");
      } else {
        setResults(data.items);
      }
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function addAll() {
    for (const item of results) {
      await onAdd(item);
    }
    setResults([]);
    setDescription("");
  }

  return (
    <div className="space-y-3">
      <textarea
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          if (!e.target.value.trim()) setResults([]);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) analyze();
        }}
        placeholder="Describe what you ate — e.g. 'grilled chicken with brown rice and steamed broccoli' or '2 scrambled eggs and toast with butter'"
        rows={3}
        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white shadow-sm resize-none transition-shadow"
      />

      <button
        onClick={analyze}
        disabled={loading || !description.trim()}
        className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-sm font-semibold py-3 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-sm disabled:shadow-none"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
            Analyzing your meal…
          </>
        ) : (
          <>
            <span>✨</span>
            Analyze with AI
          </>
        )}
      </button>
      <p className="text-[11px] text-slate-400 text-center -mt-1">⌘↵ to analyze</p>

      {error && (
        <div className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            Identified items — select what to add
          </p>
          {results.map((item, i) => (
            <ItemCard key={i} item={item} onAdd={onAdd} />
          ))}
          {results.length > 1 && (
            <button
              onClick={addAll}
              className="w-full border border-emerald-300 text-emerald-600 hover:bg-emerald-50 text-sm font-semibold py-2.5 rounded-xl transition-colors duration-150"
            >
              Add All {results.length} Items
            </button>
          )}
        </div>
      )}
    </div>
  );
}
