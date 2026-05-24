"use client";

import { useState } from "react";
import { EGG_TIERS, CREATURES, RARITY_COLORS } from "@/lib/game/catalog";

interface OpenResult {
  creature: { id: string; name: string; emoji: string; rarity: string };
  isDuplicate: boolean;
  inventoryCount: number;
  totalPoints: number;
}

interface Props {
  totalPoints: number;
  onOpen: (tier: string) => Promise<OpenResult | null>;
  onClose: () => void;
}

type Phase = "pick" | "shaking" | "reveal";

export default function MysteryEgg({ totalPoints, onOpen, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("pick");
  const [result, setResult] = useState<OpenResult | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  async function handleOpen(tierId: string) {
    const tier = EGG_TIERS.find(t => t.id === tierId);
    if (!tier || totalPoints < tier.cost) return;

    setSelectedTier(tierId);
    setPhase("shaking");

    await new Promise(r => setTimeout(r, 1200));

    const res = await onOpen(tierId);
    setResult(res);
    setPhase("reveal");
  }

  const selectedEgg = EGG_TIERS.find(t => t.id === selectedTier);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={phase === "pick" ? onClose : undefined}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>

        {phase === "pick" && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-slate-800">Mystery Eggs</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            <p className="text-xs text-slate-400 mb-4 font-medium">
              You have <span className="text-amber-600 font-bold">✦ {totalPoints.toLocaleString()}</span> points
            </p>

            <div className="space-y-3">
              {EGG_TIERS.map(tier => {
                const canAfford = totalPoints >= tier.cost;
                return (
                  <button
                    key={tier.id}
                    onClick={() => handleOpen(tier.id)}
                    disabled={!canAfford}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all
                      ${canAfford
                        ? "border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white"
                        : "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"}`}
                  >
                    <span className="text-4xl">{tier.emoji}</span>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-sm text-slate-800">{tier.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {Math.round(tier.probs.rare * 100)}% rare · {Math.round(tier.probs.legendary * 100)}% legendary
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${canAfford ? "text-amber-600" : "text-slate-400"}`}>
                        ✦ {tier.cost.toLocaleString()}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {phase === "shaking" && selectedEgg && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="text-8xl egg-shake">{selectedEgg.emoji}</div>
            <p className="text-slate-500 font-semibold text-sm animate-pulse">Opening...</p>
          </div>
        )}

        {phase === "reveal" && result && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="text-7xl creature-pop">{result.creature.emoji}</div>
            <div className="text-center">
              <p className="text-xl font-black text-slate-800">{result.creature.name}</p>
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border capitalize mt-1 ${RARITY_COLORS[result.creature.rarity as keyof typeof RARITY_COLORS]}`}>
                {result.creature.rarity}
              </span>
            </div>

            {result.isDuplicate ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center">
                <p className="text-xs font-bold text-amber-700">Already owned!</p>
                <p className="text-[11px] text-amber-600 mt-0.5">Added to inventory ({result.inventoryCount} total)</p>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-center">
                <p className="text-xs font-bold text-emerald-700">New creature unlocked! 🎉</p>
              </div>
            )}

            <p className="text-xs text-slate-400 font-medium">
              Remaining: <span className="text-amber-600 font-bold">✦ {result.totalPoints.toLocaleString()}</span>
            </p>

            <button
              onClick={onClose}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              Awesome!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
