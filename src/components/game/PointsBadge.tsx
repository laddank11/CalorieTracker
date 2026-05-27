"use client";

import Link from "next/link";
import { useGame } from "@/hooks/useGame";

export default function PointsBadge() {
  const { status } = useGame();
  if (!status) return null;

  const pts = status.totalPoints.toLocaleString();
  const streak = status.streak;

  return (
    <Link
      href="/nutri"
      className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full px-3 py-1 transition-colors"
    >
      <span className="text-sm">✦</span>
      <span className="text-xs font-bold text-amber-700 tabular">{pts}</span>
      {streak > 0 && (
        <>
          <span className="text-slate-300 text-xs">·</span>
          <span className="text-sm">🔥</span>
          <span className="text-xs font-bold text-orange-600">{streak}</span>
        </>
      )}
    </Link>
  );
}
