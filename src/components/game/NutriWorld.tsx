"use client";

import { CREATURES, ENVIRONMENTS } from "@/lib/game/catalog";

interface Props {
  activeCreatureId: string | null;
  activeEnvironmentId: string;
  level: number;
  xpPct: number;
  xpCurrent: number;
  xpNeeded: number;
}

export default function NutriWorld({ activeCreatureId, activeEnvironmentId, level, xpPct, xpCurrent, xpNeeded }: Props) {
  const env = ENVIRONMENTS.find(e => e.id === activeEnvironmentId) ?? ENVIRONMENTS[0];
  const creature = CREATURES.find(c => c.id === activeCreatureId);

  return (
    <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${env.gradient} shadow-lg`} style={{ minHeight: 220 }}>
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <span
            key={i}
            className="absolute text-white/20 text-2xl select-none"
            style={{
              left:  `${10 + i * 11}%`,
              top:   `${15 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.4}s`,
              animation: "float 4s ease-in-out infinite",
            }}
          >
            ✦
          </span>
        ))}
      </div>

      {/* Environment name */}
      <div className="absolute top-4 left-5">
        <p className="text-white/70 text-[11px] font-semibold uppercase tracking-widest">
          {env.emoji} {env.name}
        </p>
      </div>

      {/* Level badge */}
      <div className="absolute top-4 right-5">
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-3 py-1 text-center">
          <p className="text-[9px] text-white/70 font-bold uppercase tracking-wider">Level</p>
          <p className="text-2xl font-black text-white leading-none">{level}</p>
        </div>
      </div>

      {/* Central creature */}
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <div className="text-7xl creature-float drop-shadow-lg select-none">
          {creature ? creature.emoji : "🌍"}
        </div>
        {creature && (
          <p className="text-white font-bold text-sm drop-shadow">{creature.name}</p>
        )}
      </div>

      {/* XP bar */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
        <div className="flex items-center justify-between text-[10px] text-white/70 mb-1 font-semibold">
          <span>XP {xpCurrent} / {xpNeeded}</span>
          <span>{xpPct}%</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/70 rounded-full transition-all duration-700"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
