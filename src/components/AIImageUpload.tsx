"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { NutritionItem, NutritionAnalysis } from "@/types";

interface Props {
  onAdd: (item: NutritionItem) => void;
}

function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(0.5, parseFloat((value - 0.5).toFixed(1))))}
        className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center transition-colors"
      >
        −
      </button>
      <input
        type="number"
        min={0.5}
        step={0.5}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v) && v > 0) onChange(v);
        }}
        className="w-10 text-center text-sm font-bold text-slate-700 bg-transparent focus:outline-none tabular-nums"
      />
      <button
        onClick={() => onChange(parseFloat((value + 0.5).toFixed(1)))}
        className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center transition-colors"
      >
        +
      </button>
    </div>
  );
}

function ItemCard({ item, onAdd }: { item: NutritionItem; onAdd: (i: NutritionItem) => void }) {
  const [qty, setQty] = useState(item.quantity);
  const [added, setAdded] = useState(false);

  const total = {
    calories: Math.round(item.calories * qty),
    protein:  (item.protein  * qty).toFixed(0),
    carbs:    (item.carbs    * qty).toFixed(0),
    fat:      (item.fat      * qty).toFixed(0),
  };

  function handleAdd() {
    onAdd({ ...item, quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 text-sm truncate">{item.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            <span className="text-blue-500 font-medium">P {total.protein}g</span>
            <span className="mx-1 text-slate-300">·</span>
            <span className="text-amber-500 font-medium">C {total.carbs}g</span>
            <span className="mx-1 text-slate-300">·</span>
            <span className="text-rose-400 font-medium">F {total.fat}g</span>
            <span className="mx-1.5 text-slate-200">·</span>
            {item.servingSize}
          </p>
        </div>
        <span className="text-sm font-bold text-emerald-600 tabular-nums shrink-0">
          {total.calories} kcal
        </span>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Qty</span>
          <QuantityStepper value={qty} onChange={setQty} />
        </div>
        <button
          onClick={handleAdd}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200
            ${added
              ? "bg-emerald-100 text-emerald-700"
              : "bg-emerald-500 hover:bg-emerald-600 text-white"
            }`}
        >
          {added ? "✓ Added" : "+ Add"}
        </button>
      </div>
    </div>
  );
}

export default function AIImageUpload({ onAdd }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<NutritionItem[]>([]);
  const [summary, setSummary] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function selectFile(f: File) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResults([]);
    setSummary("");
    setError("");
  }

  function clear() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setResults([]);
    setSummary("");
    setError("");
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) selectFile(f);
  }, []);

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResults([]);
    setSummary("");
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/ai/image", { method: "POST", body: form });
      const data: NutritionAnalysis = await res.json();
      if (!data.items?.length) {
        setError(
          data.summary && data.summary !== "Could not analyze"
            ? data.summary
            : "No foods detected. Try a clearer photo or use JPEG/PNG format."
        );
      } else {
        setResults(data.items);
        setSummary(data.summary ?? "");
      }
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function addAll() {
    for (const item of results) await onAdd(item);
    clear();
  }

  return (
    <div className="space-y-3">
      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl py-12 px-6 text-center cursor-pointer transition-all duration-150
            ${dragging ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-emerald-300 hover:bg-slate-50"}`}
        >
          <div className="text-4xl mb-3">📷</div>
          <p className="text-sm font-semibold text-slate-600">Drop a photo here</p>
          <p className="text-xs text-slate-400 mt-1">or click to browse your files</p>
          <p className="text-[11px] text-slate-300 mt-3">JPEG · PNG · WEBP · HEIC · up to 10 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) selectFile(f); }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-slate-100 max-h-64 flex items-center justify-center">
            <Image src={preview} alt="Meal preview" width={800} height={400} className="object-contain max-h-64 w-full" unoptimized />
            <button
              onClick={clear}
              className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-600 rounded-full w-7 h-7 flex items-center justify-center text-sm shadow-sm transition-colors"
            >
              ×
            </button>
          </div>
          <button
            onClick={analyze}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white text-sm font-semibold py-3 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-sm disabled:shadow-none"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                Identifying foods…
              </>
            ) : (
              <><span>✨</span> Analyze Photo</>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="text-xs text-rose-500 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">{error}</div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {summary && (
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{summary}</p>
          )}
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
            Adjust quantities, then add
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
