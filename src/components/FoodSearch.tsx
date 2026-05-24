"use client";

import { useState, useEffect, useRef } from "react";
import { Food } from "@/types";
import { formatFoodName } from "@/lib/utils";

interface Props {
  onAdd: (food: Food, qty: number) => void;
}

function FoodCard({ food, onAdd }: { food: Food; onAdd: (f: Food, qty: number) => void }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    onAdd(food, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex flex-col gap-1.5 hover:border-emerald-200 hover:shadow-sm transition-all duration-150">
      <p className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">{formatFoodName(food.name)}</p>
      <p className="text-xs text-slate-400">{food.servingSize}</p>
      <p className="text-base font-bold text-emerald-600">{Math.round(food.calories * qty)} kcal</p>
      <div className="flex gap-2.5 text-xs">
        <span className="text-blue-500 font-medium">P {(food.protein * qty).toFixed(0)}g</span>
        <span className="text-amber-500 font-medium">C {(food.carbs * qty).toFixed(0)}g</span>
        <span className="text-rose-400 font-medium">F {(food.fat * qty).toFixed(0)}g</span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setQty(q => Math.max(0.5, parseFloat((q - 0.5).toFixed(1))))}
            className="w-6 h-6 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm flex items-center justify-center transition-colors"
          >−</button>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={qty}
            onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) setQty(v); }}
            className="w-9 text-center text-xs font-bold text-slate-700 bg-transparent focus:outline-none tabular-nums"
          />
          <button
            onClick={() => setQty(q => parseFloat((q + 0.5).toFixed(1)))}
            className="w-6 h-6 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-sm flex items-center justify-center transition-colors"
          >+</button>
        </div>
        <button
          onClick={handleAdd}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200
            ${added ? "bg-emerald-100 text-emerald-700" : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}
        >
          {added ? "✓" : "+ Add"}
        </button>
      </div>
    </div>
  );
}

export default function FoodSearch({ onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleAdd(food: Food, qty: number) {
    onAdd({ ...food, name: formatFoodName(food.name) }, qty);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.error) setError(data.error);
        setResults(data.results ?? []);
      } catch {
        setError("Search failed. Check your connection.");
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [query]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search any food — powered by USDA database…"
          className="w-full border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-white shadow-sm transition-shadow"
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        )}
        {!loading && query && (
          <button
            onClick={() => { setQuery(""); setResults([]); }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {error && (
        <div className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {results.map((food) => (
            <FoodCard key={food.id} food={food} onAdd={(f, qty) => handleAdd(f, qty)} />
          ))}
        </div>
      )}

      {query.trim().length >= 2 && !loading && results.length === 0 && !error && (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-slate-400 mt-1">Try the Describe tab to add it manually</p>
        </div>
      )}

      {!query && (
        <p className="text-xs text-slate-400 text-center py-2">
          Start typing to search 400,000+ foods
        </p>
      )}
    </div>
  );
}
