"use client";

import { Food } from "@/types";
import { COMMON_FOODS } from "@/lib/foods";

interface Props {
  onAdd: (food: Food) => void;
}

export default function QuickAdd({ onAdd }: Props) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">Tap any food to add it instantly to your selected meal.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {COMMON_FOODS.map((food) => (
          <button
            key={food.id}
            onClick={() => onAdd(food)}
            className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-left hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-sm transition-all duration-150 group"
          >
            <p className="text-xs font-semibold text-slate-700 truncate group-hover:text-emerald-700 leading-snug">
              {food.name}
            </p>
            <p className="text-sm font-bold text-emerald-600 mt-1">{food.calories} kcal</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{food.servingSize}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
