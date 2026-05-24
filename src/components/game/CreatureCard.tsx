"use client";

import type { Creature } from "@/lib/game/catalog";
import { RARITY_COLORS, RARITY_GLOW } from "@/lib/game/catalog";

interface Props {
  creature: Creature;
  owned: boolean;
  active: boolean;
  totalPoints: number;
  onEquip?: (id: string) => void;
  onUnlock?: (id: string) => void;
}

export default function CreatureCard({ creature, owned, active, totalPoints, onEquip, onUnlock }: Props) {
  const canAfford = totalPoints >= creature.unlockCost;
  const rarityClass = RARITY_COLORS[creature.rarity];
  const glowClass   = RARITY_GLOW[creature.rarity];

  return (
    <div
      className={`relative bg-white rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all duration-200
        ${active ? "border-emerald-400 shadow-md shadow-emerald-100" : "border-slate-200 hover:border-slate-300"}
        ${owned ? "" : "opacity-60"}
        ${glowClass}`}
    >
      {active && (
        <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
          Active
        </span>
      )}

      <span className="text-4xl creature-float">{creature.emoji}</span>

      <div className="text-center">
        <p className="text-sm font-bold text-slate-800 leading-tight">{creature.name}</p>
        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-1 capitalize ${rarityClass}`}>
          {creature.rarity}
        </span>
      </div>

      <p className="text-[11px] text-slate-400 text-center leading-snug">{creature.trait}</p>

      <div className="w-full mt-1">
        {owned ? (
          <button
            onClick={() => onEquip?.(creature.id)}
            disabled={active}
            className={`w-full text-xs font-bold py-1.5 rounded-xl transition-colors
              ${active
                ? "bg-emerald-50 text-emerald-400 cursor-default"
                : "bg-emerald-500 hover:bg-emerald-600 text-white"}`}
          >
            {active ? "Equipped" : "Equip"}
          </button>
        ) : (
          <button
            onClick={() => onUnlock?.(creature.id)}
            disabled={!canAfford}
            className={`w-full text-xs font-bold py-1.5 rounded-xl transition-colors flex items-center justify-center gap-1
              ${canAfford
                ? "bg-amber-400 hover:bg-amber-500 text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
          >
            <span>✦</span>
            <span>{creature.unlockCost.toLocaleString()}</span>
          </button>
        )}
      </div>
    </div>
  );
}
