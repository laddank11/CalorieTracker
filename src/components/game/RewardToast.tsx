"use client";

import { useGame } from "@/hooks/useGame";

export default function RewardToasts() {
  const { toasts, dismissToast } = useGame();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className="pointer-events-auto flex items-center gap-2.5 bg-white border border-emerald-200 shadow-lg shadow-emerald-100/50 rounded-2xl px-4 py-3 animate-slide-up max-w-[260px]"
        >
          <span className="text-2xl leading-none">{t.emoji}</span>
          <div className="text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">{t.label}</p>
            <p className="text-[11px] text-emerald-600 font-semibold">+{t.points} pts</p>
          </div>
          <span className="ml-1 text-[10px] text-amber-500 font-black tabular">✦</span>
        </button>
      ))}
    </div>
  );
}
