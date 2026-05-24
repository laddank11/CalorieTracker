"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useGame } from "@/hooks/useGame";
import NutriWorld from "@/components/game/NutriWorld";
import CreatureCard from "@/components/game/CreatureCard";
import MysteryEgg from "@/components/game/MysteryEgg";
import { CREATURES, ENVIRONMENTS, EGG_TIERS, RARITY_COLORS, xpProgress } from "@/lib/game/catalog";

type Tab = "world" | "creatures" | "shop" | "events";

interface GameProfile {
  userId: string;
  totalPoints: number;
  lifetimePoints: number;
  level: number;
  experience: number;
  activeCreature: string | null;
  activeEnvironment: string;
  unlockedCreatures: string[];
  unlockedEnvironments: string[];
  inventory: { creatureId: string; count: number }[];
}

interface DailyEvent {
  type: string;
  emoji: string;
  label: string;
  multiplier: number;
  bonus: number;
}

export default function GamePage() {
  const { status, loadStatus } = useGame();
  const [tab, setTab] = useState<Tab>("world");
  const [profile, setProfile] = useState<GameProfile | null>(null);
  const [events, setEvents] = useState<DailyEvent[]>([]);
  const [history, setHistory] = useState<{ reward_type: string; points_awarded: number; date_claimed: string; emoji: string; label: string }[]>([]);
  const [showEgg, setShowEgg] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/game/profile");
    if (res.ok) setProfile(await res.json());
  }, []);

  const loadEvents = useCallback(async () => {
    const res = await fetch("/api/game/events");
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events ?? []);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/rewards/history?limit=20");
    if (res.ok) {
      const data = await res.json();
      setHistory(data.history ?? []);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadEvents();
    loadStatus();
  }, [loadProfile, loadEvents, loadStatus]);

  useEffect(() => {
    if (tab === "events") loadHistory();
  }, [tab, loadHistory]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleEquip(creatureId: string) {
    const res = await fetch("/api/game/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeCreature: creatureId }),
    });
    if (res.ok) {
      setProfile(await res.json());
      showToast("Creature equipped!");
    }
  }

  async function handleEquipEnvironment(envId: string) {
    const res = await fetch("/api/game/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeEnvironment: envId }),
    });
    if (res.ok) {
      setProfile(await res.json());
      showToast("Environment changed!");
    }
  }

  async function handleUnlockCreature(creatureId: string) {
    const res = await fetch("/api/game/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "creature", id: creatureId }),
    });
    if (res.ok) {
      setProfile(await res.json());
      loadStatus();
      showToast("Creature unlocked!");
    } else {
      const data = await res.json();
      showToast(data.error ?? "Cannot unlock");
    }
  }

  async function handleUnlockEnvironment(envId: string) {
    const res = await fetch("/api/game/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "environment", id: envId }),
    });
    if (res.ok) {
      setProfile(await res.json());
      loadStatus();
      showToast("Environment unlocked!");
    } else {
      const data = await res.json();
      showToast(data.error ?? "Cannot unlock");
    }
  }

  async function handleOpenEgg(tier: string) {
    const res = await fetch("/api/game/egg", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier }),
    });
    if (!res.ok) {
      const data = await res.json();
      showToast(data.error ?? "Failed to open egg");
      return null;
    }
    const data = await res.json();
    await loadProfile();
    loadStatus();
    if (!data.creature) {
      showToast("All creatures owned — points refunded!");
      return null;
    }
    return {
      creature: { id: data.creature.id, name: data.creature.name, emoji: data.creature.emoji, rarity: data.creature.rarity },
      isDuplicate: !data.isNew,
      inventoryCount: data.isNew ? 0 : 1,
      totalPoints: data.totalPoints,
    };
  }

  const xp = xpProgress(profile?.experience ?? 0);
  const pts = profile?.totalPoints ?? 0;
  const owned = new Set(profile?.unlockedCreatures ?? []);
  const ownedEnvs = new Set(profile?.unlockedEnvironments ?? []);

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "world",     label: "World",     icon: "🌍" },
    { id: "creatures", label: "Creatures", icon: "🐾" },
    { id: "shop",      label: "Shop",      icon: "🛒" },
    { id: "events",    label: "Events",    icon: "⚡" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f6f8" }}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium">
              ← Back
            </Link>
            <span className="text-slate-200">|</span>
            <h1 className="font-black text-slate-900 text-base">Nutriverse Adventure</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            <span className="text-xs">✦</span>
            <span className="text-xs font-bold text-amber-700 tabular">{pts.toLocaleString()}</span>
            {status?.streak ? (
              <>
                <span className="text-slate-300 text-xs">·</span>
                <span className="text-sm">🔥</span>
                <span className="text-xs font-bold text-orange-600">{status.streak}</span>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Tab bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex overflow-hidden">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 text-[11px] font-bold tracking-wide transition-all flex items-center justify-center gap-1
                ${tab === t.id
                  ? "text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50"
                  : "text-slate-400 hover:text-slate-600 border-b-2 border-transparent"}`}
            >
              <span>{t.icon}</span>
              <span className="uppercase hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg animate-fade-in">
            {toast}
          </div>
        )}

        {/* World Tab */}
        {tab === "world" && profile && (
          <div className="space-y-4 fade-up fade-up-1">
            <NutriWorld
              activeCreatureId={profile.activeCreature}
              activeEnvironmentId={profile.activeEnvironment}
              level={xp.level}
              xpPct={xp.pct}
              xpCurrent={xp.current}
              xpNeeded={xp.needed}
            />

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Lifetime pts", value: profile.lifetimePoints.toLocaleString(), icon: "✦" },
                { label: "Streak",       value: `${status?.streak ?? 0} days`,           icon: "🔥" },
                { label: "Creatures",    value: `${owned.size} / ${CREATURES.length}`,    icon: "🐾" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-3 text-center">
                  <p className="text-xl mb-1">{s.icon}</p>
                  <p className="text-base font-black text-slate-800 tabular">{s.value}</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Today's claimed rewards */}
            {status?.claimedToday && status.claimedToday.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Today&apos;s Rewards</p>
                <div className="flex flex-wrap gap-2">
                  {status.claimedToday.map((r, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                      <span className="text-xs font-bold text-emerald-700">{r.reward_type.replace(/_/g, " ")}</span>
                      <span className="text-[10px] text-emerald-500 font-bold">+{r.points_awarded}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active events */}
            {events.length > 0 && (
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-3">Today&apos;s Events</p>
                <div className="space-y-2">
                  {events.map((ev, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xl">{ev.emoji}</span>
                      <p className="text-sm font-semibold text-violet-700">{ev.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Creatures Tab */}
        {tab === "creatures" && profile && (
          <div className="space-y-4 fade-up fade-up-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CREATURES.map(c => (
                <CreatureCard
                  key={c.id}
                  creature={c}
                  owned={owned.has(c.id)}
                  active={profile.activeCreature === c.id}
                  totalPoints={pts}
                  onEquip={handleEquip}
                  onUnlock={handleUnlockCreature}
                />
              ))}
            </div>
          </div>
        )}

        {/* Shop Tab */}
        {tab === "shop" && profile && (
          <div className="space-y-5 fade-up fade-up-1">
            {/* Mystery Eggs */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-slate-800">Mystery Eggs</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Open to discover random creatures</p>
                </div>
                <button
                  onClick={() => setShowEgg(true)}
                  className="bg-amber-400 hover:bg-amber-500 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors"
                >
                  Open Egg
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {EGG_TIERS.map(t => (
                  <div key={t.id} className={`rounded-xl bg-gradient-to-br ${t.color} p-3 text-center`}>
                    <p className="text-3xl mb-1">{t.emoji}</p>
                    <p className="text-xs font-bold text-white drop-shadow">{t.name}</p>
                    <p className="text-[11px] text-white/80 font-semibold">✦ {t.cost}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Environments */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-black text-slate-800 mb-1">Environments</h3>
              <p className="text-xs text-slate-400 mb-4">Change your Nutriverse backdrop</p>
              <div className="space-y-3">
                {ENVIRONMENTS.map(env => {
                  const envOwned = ownedEnvs.has(env.id);
                  const isActive = profile.activeEnvironment === env.id;
                  const canAfford = pts >= env.unlockCost;
                  const meetsLevel = (profile.level ?? 1) >= env.requiredLevel;
                  return (
                    <div
                      key={env.id}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all
                        ${isActive ? "border-emerald-300 bg-emerald-50" : "border-slate-100 hover:border-slate-200"}`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${env.gradient} flex items-center justify-center text-2xl flex-shrink-0`}>
                        {env.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800">{env.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{env.description}</p>
                        {env.requiredLevel > 1 && (
                          <p className="text-[10px] text-violet-500 font-semibold mt-0.5">Requires Level {env.requiredLevel}</p>
                        )}
                      </div>
                      {isActive ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full flex-shrink-0">Active</span>
                      ) : envOwned ? (
                        <button
                          onClick={() => handleEquipEnvironment(env.id)}
                          className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl transition-colors flex-shrink-0"
                        >
                          Use
                        </button>
                      ) : env.unlockCost === 0 ? (
                        <span className="text-xs text-slate-400 flex-shrink-0">Free</span>
                      ) : (
                        <button
                          onClick={() => handleUnlockEnvironment(env.id)}
                          disabled={!canAfford || !meetsLevel}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex-shrink-0 flex items-center gap-1
                            ${canAfford && meetsLevel
                              ? "bg-amber-400 hover:bg-amber-500 text-white"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                        >
                          <span>✦</span>
                          <span>{env.unlockCost.toLocaleString()}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {tab === "events" && (
          <div className="space-y-4 fade-up fade-up-1">
            {events.length > 0 && (
              <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-5">
                <h3 className="font-black text-violet-800 mb-3">Today&apos;s Events</h3>
                <div className="space-y-3">
                  {events.map((ev, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/60 rounded-xl p-3">
                      <span className="text-3xl">{ev.emoji}</span>
                      <div>
                        <p className="font-bold text-sm text-violet-800">{ev.label}</p>
                        {ev.multiplier > 1 && (
                          <p className="text-[11px] text-violet-500">×{ev.multiplier} multiplier</p>
                        )}
                        {ev.bonus > 0 && (
                          <p className="text-[11px] text-violet-500">+{ev.bonus} bonus pts</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {events.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-sm font-bold text-slate-600">No special events today</p>
                <p className="text-xs text-slate-400 mt-1">Check back tomorrow!</p>
              </div>
            )}

            {/* Reward history */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-black text-slate-800 mb-4">Reward History</h3>
              {history.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No rewards yet. Log meals to earn points!</p>
              ) : (
                <div className="space-y-2">
                  {history.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{r.emoji}</span>
                        <div>
                          <p className="text-xs font-bold text-slate-700">{r.label}</p>
                          <p className="text-[10px] text-slate-400">{r.date_claimed}</p>
                        </div>
                      </div>
                      <span className="text-sm font-black text-amber-600">+{r.points_awarded}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {showEgg && profile && (
        <MysteryEgg
          totalPoints={pts}
          onOpen={handleOpenEgg}
          onClose={() => setShowEgg(false)}
        />
      )}
    </div>
  );
}
