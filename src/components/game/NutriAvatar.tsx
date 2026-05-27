"use client";

import { COSMETICS, MOOD_CONFIG, BACKGROUND_GRADIENTS, Mood } from "@/lib/game/catalog";

interface Props {
  mood: Mood;
  equipped: Record<string, string>;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

export default function NutriAvatar({ mood, equipped, size = "md", animated = true }: Props) {
  const moodCfg = MOOD_CONFIG[mood];
  const bgId    = equipped["background"] ?? "healthy_forest";
  const bgGrad  = BACKGROUND_GRADIENTS[bgId] ?? BACKGROUND_GRADIENTS["healthy_forest"];

  const sizeMap = {
    sm: { wrap: "w-20 h-20", body: "text-4xl", badge: "text-xs px-1.5 py-0.5", accText: "text-base" },
    md: { wrap: "w-36 h-36", body: "text-6xl", badge: "text-xs px-2 py-0.5",   accText: "text-xl"   },
    lg: { wrap: "w-52 h-52", body: "text-8xl", badge: "text-sm px-2.5 py-1",   accText: "text-3xl"  },
  };
  const sz = sizeMap[size];

  const hat       = equipped["hat"]       ? COSMETICS.find(c => c.id === equipped["hat"])       : null;
  const outfit    = equipped["outfit"]    ? COSMETICS.find(c => c.id === equipped["outfit"])    : null;
  const accessory = equipped["accessory"] ? COSMETICS.find(c => c.id === equipped["accessory"]) : null;
  const shoes     = equipped["shoes"]     ? COSMETICS.find(c => c.id === equipped["shoes"])     : null;
  const emote     = equipped["emote"]     ? COSMETICS.find(c => c.id === equipped["emote"])     : null;

  const animClass = animated ? {
    happy:        "animate-bounce",
    celebrating:  "animate-bounce",
    dancing:      "animate-spin",
    energetic:    "animate-pulse",
    glowing:      "animate-pulse",
    sleepy:       "",
    disappointed: "",
  }[mood] : "";

  return (
    <div className={`relative ${sz.wrap} rounded-full bg-gradient-to-br ${bgGrad} flex items-center justify-center overflow-hidden shadow-lg`}>
      {/* Nutri body */}
      <div className={`flex flex-col items-center select-none ${animClass}`}>
        {hat && <span className={sz.accText} title={hat.name}>{hat.emoji}</span>}
        <span className={sz.body}>🧑</span>
        {outfit && <span className={sz.accText} title={outfit.name}>{outfit.emoji}</span>}
        {shoes && <span className={sz.accText} title={shoes.name}>{shoes.emoji}</span>}
      </div>

      {/* Accessory overlay (top-right) */}
      {accessory && (
        <span className="absolute top-1 right-1 text-lg" title={accessory.name}>{accessory.emoji}</span>
      )}

      {/* Emote overlay (bottom-left) */}
      {emote && (
        <span className="absolute bottom-1 left-1 text-lg" title={emote.name}>{emote.emoji}</span>
      )}

      {/* Mood badge */}
      <span className={`absolute bottom-1 right-1 ${moodCfg.color} bg-white/80 rounded-full font-semibold ${sz.badge}`}>
        {moodCfg.emoji}
      </span>
    </div>
  );
}
