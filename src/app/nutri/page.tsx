"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import NutriAvatar from "@/components/game/NutriAvatar";
import { COSMETICS, CATEGORY_LABELS, RARITY_COLORS, Mood, Category, CosmeticItem } from "@/lib/game/catalog";
import { useGame } from "@/hooks/useGame";

type Tab = "avatar" | "shop" | "wardrobe";

interface AvatarData {
  mood: Mood;
  equipped: Record<string, string>;
}

const MOOD_OPTIONS: { mood: Mood; emoji: string; label: string }[] = [
  { mood: "happy",        emoji: "😊", label: "Happy"       },
  { mood: "celebrating",  emoji: "🥳", label: "Celebrating" },
  { mood: "dancing",      emoji: "💃", label: "Dancing"     },
  { mood: "energetic",    emoji: "⚡", label: "Energetic"   },
  { mood: "glowing",      emoji: "✨", label: "Glowing"     },
  { mood: "sleepy",       emoji: "😴", label: "Sleepy"      },
  { mood: "disappointed", emoji: "😔", label: "Disappointed"},
];

const CATEGORIES: Category[] = ["outfit", "accessory", "hat", "shoes", "background", "animation", "emote"];

export default function NutriPage() {
  const { status, loadStatus } = useGame();
  const [tab, setTab]           = useState<Tab>("avatar");
  const [avatar, setAvatar]     = useState<AvatarData | null>(null);
  const [inventory, setInventory] = useState<string[]>([]);
  const [filterCat, setFilterCat] = useState<Category | "all">("all");
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(false);
  const [msg, setMsg]           = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [avRes, invRes] = await Promise.all([
      fetch("/api/avatar"),
      fetch("/api/shop/inventory"),
    ]);
    if (avRes.ok)  setAvatar(await avRes.json());
    if (invRes.ok) setInventory(await invRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
    loadStatus();
  }, [loadAll, loadStatus]);

  async function equip(itemId: string) {
    setBusy(true);
    const res = await fetch("/api/avatar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "equip", itemId }),
    });
    if (res.ok) {
      flash("Equipped!", true);
      await loadAll();
    } else {
      const d = await res.json();
      flash(d.error ?? "Failed", false);
    }
    setBusy(false);
  }

  async function unequip(category: Category) {
    setBusy(true);
    await fetch("/api/avatar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unequip", category }),
    });
    flash("Unequipped", true);
    await loadAll();
    setBusy(false);
  }

  async function setMood(mood: Mood) {
    setBusy(true);
    await fetch("/api/avatar", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mood", mood }),
    });
    setAvatar(prev => prev ? { ...prev, mood } : prev);
    setBusy(false);
  }

  async function purchase(item: CosmeticItem) {
    if (!status) return;
    if (status.totalPoints < item.cost) { flash("Not enough points!", false); return; }
    setBusy(true);
    const res = await fetch("/api/shop/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id }),
    });
    if (res.ok) {
      flash(`Purchased ${item.name}!`, true);
      await Promise.all([loadAll(), loadStatus()]);
    } else {
      const d = await res.json();
      flash(d.error ?? "Purchase failed", false);
    }
    setBusy(false);
  }

  const pts = status?.totalPoints ?? 0;
  const ownedSet = new Set(inventory);

  // Items shown in shop (excludes free items — they're auto-available)
  const shopItems = COSMETICS.filter(c => c.cost > 0 && (filterCat === "all" || c.category === filterCat));

  // Items shown in wardrobe (owned + free)
  const wardrobeItems = COSMETICS.filter(c => c.cost === 0 || ownedSet.has(c.id));
  const filteredWardrobe = wardrobeItems.filter(c => filterCat === "all" || c.category === filterCat);

  return (
    <div className="min-h-screen bg-[#f4f6f8]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-slate-500 hover:text-slate-700 text-sm">← Home</Link>
        <h1 className="text-lg font-bold text-slate-800 flex-1">Nutri</h1>
        <span className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
          ✦ {pts.toLocaleString()} pts
        </span>
      </header>

      {/* Flash message */}
      {msg && (
        <div className={`mx-4 mt-3 px-4 py-2 rounded-lg text-sm font-medium text-center ${msg.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4">
        {(["avatar", "wardrobe", "shop"] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            {t === "avatar" ? "🧑 Avatar" : t === "wardrobe" ? "👗 Wardrobe" : "🛒 Shop"}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center text-slate-400 py-16">Loading…</div>
        ) : (

          /* ── AVATAR TAB ──────────────────────────────────────────── */
          tab === "avatar" && avatar ? (
            <div className="space-y-6">
              {/* Avatar display */}
              <div className="flex justify-center">
                <NutriAvatar mood={avatar.mood} equipped={avatar.equipped} size="lg" />
              </div>

              {/* Mood picker */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h2 className="text-sm font-semibold text-slate-600 mb-3">Mood</h2>
                <div className="flex flex-wrap gap-2">
                  {MOOD_OPTIONS.map(m => (
                    <button
                      key={m.mood}
                      disabled={busy}
                      onClick={() => setMood(m.mood)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${avatar.mood === m.mood ? "bg-emerald-100 text-emerald-700 border border-emerald-300" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipped slots */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h2 className="text-sm font-semibold text-slate-600 mb-3">Equipped</h2>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => {
                    const itemId = avatar.equipped[cat];
                    const item   = itemId ? COSMETICS.find(c => c.id === itemId) : null;
                    return (
                      <div key={cat} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                        <span className="text-xs text-slate-500 capitalize">{CATEGORY_LABELS[cat]}</span>
                        {item ? (
                          <div className="flex items-center gap-1.5">
                            <span>{item.emoji}</span>
                            <span className="text-xs text-slate-700 font-medium truncate max-w-[80px]">{item.name}</span>
                            <button
                              disabled={busy}
                              onClick={() => unequip(cat)}
                              className="text-slate-400 hover:text-red-500 text-xs leading-none"
                              title="Unequip"
                            >✕</button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 italic">none</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          /* ── WARDROBE TAB ─────────────────────────────────────────── */
          ) : tab === "wardrobe" ? (
            <div className="space-y-4">
              <CategoryFilter value={filterCat} onChange={setFilterCat} />
              {filteredWardrobe.length === 0 ? (
                <div className="text-center text-slate-400 py-12">
                  <p className="text-4xl mb-2">👗</p>
                  <p>No items yet. Visit the Shop!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredWardrobe.map(item => {
                    const isEquipped = avatar?.equipped[item.category] === item.id;
                    return (
                      <ItemCard
                        key={item.id}
                        item={item}
                        isEquipped={isEquipped}
                        owned
                        busy={busy}
                        onEquip={() => isEquipped ? unequip(item.category as Category) : equip(item.id)}
                        equipLabel={isEquipped ? "Unequip" : "Equip"}
                      />
                    );
                  })}
                </div>
              )}
            </div>

          /* ── SHOP TAB ─────────────────────────────────────────────── */
          ) : tab === "shop" ? (
            <div className="space-y-4">
              <CategoryFilter value={filterCat} onChange={setFilterCat} />
              <div className="grid grid-cols-2 gap-3">
                {shopItems.map(item => {
                  const owned     = ownedSet.has(item.id);
                  const canAfford = pts >= item.cost;
                  return (
                    <ItemCard
                      key={item.id}
                      item={item}
                      owned={owned}
                      isEquipped={avatar?.equipped[item.category] === item.id}
                      busy={busy}
                      onEquip={owned ? () => equip(item.id) : undefined}
                      onBuy={!owned ? () => purchase(item) : undefined}
                      canAfford={canAfford}
                    />
                  );
                })}
              </div>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function CategoryFilter({ value, onChange }: { value: Category | "all"; onChange: (v: Category | "all") => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => onChange("all")}
        className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${value === "all" ? "bg-emerald-100 text-emerald-700 border border-emerald-300" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
      >All</button>
      {(["outfit","accessory","hat","shoes","background","animation","emote"] as Category[]).map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium capitalize ${value === cat ? "bg-emerald-100 text-emerald-700 border border-emerald-300" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
        >{CATEGORY_LABELS[cat]}</button>
      ))}
    </div>
  );
}

interface ItemCardProps {
  item: CosmeticItem;
  owned: boolean;
  isEquipped: boolean;
  busy: boolean;
  onEquip?: () => void;
  onBuy?: () => void;
  equipLabel?: string;
  canAfford?: boolean;
}

function ItemCard({ item, owned, isEquipped, busy, onEquip, onBuy, equipLabel = "Equip", canAfford = true }: ItemCardProps) {
  const rarityClass = RARITY_COLORS[item.rarity];
  return (
    <div className={`bg-white rounded-2xl border p-3 flex flex-col gap-2 ${isEquipped ? "border-emerald-400 ring-1 ring-emerald-300" : "border-slate-200"}`}>
      <div className="flex items-start justify-between">
        <span className="text-3xl">{item.emoji}</span>
        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${rarityClass}`}>
          {item.rarity}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800 leading-tight">{item.name}</p>
        <p className="text-xs text-slate-400 leading-tight">{item.description}</p>
      </div>
      {owned ? (
        <button
          disabled={busy}
          onClick={onEquip}
          className={`mt-auto text-xs font-semibold py-1.5 rounded-lg transition-colors ${isEquipped ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
        >
          {isEquipped ? "✓ " : ""}{equipLabel ?? "Equip"}
        </button>
      ) : (
        <button
          disabled={busy || !canAfford}
          onClick={onBuy}
          className={`mt-auto text-xs font-semibold py-1.5 rounded-lg transition-colors ${canAfford ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
        >
          ✦ {item.cost.toLocaleString()} pts
        </button>
      )}
    </div>
  );
}
