import { randomBytes } from "crypto";
import { getDb } from "../db";
import { CREATURES, ENVIRONMENTS, EGG_TIERS, levelFromXp, Rarity } from "./catalog";

function uid() { return randomBytes(8).toString("hex"); }

function ensureGameProfile(userId: string) {
  getDb().prepare(`INSERT OR IGNORE INTO game_profiles (id, user_id) VALUES (?, ?)`).run(uid(), userId);
}

function ensureRewardPoints(userId: string) {
  getDb().prepare(`INSERT OR IGNORE INTO reward_points (id, user_id) VALUES (?, ?)`).run(uid(), userId);
}

export function getGameProfile(userId: string) {
  ensureGameProfile(userId);
  ensureRewardPoints(userId);
  const db = getDb();

  const profile = db.prepare(`SELECT * FROM game_profiles WHERE user_id = ?`).get(userId) as any;
  const pts     = db.prepare(`SELECT total_points, lifetime_points FROM reward_points WHERE user_id = ?`).get(userId) as any;

  const unlockedCreatures    = JSON.parse(profile.unlocked_creatures    || "[]") as string[];
  const unlockedEnvironments = JSON.parse(profile.unlocked_environments || '["healthy_forest"]') as string[];
  const inventory            = JSON.parse(profile.inventory             || "[]") as any[];

  return {
    level:              profile.level,
    experience:         profile.experience,
    activeEnvironment:  profile.active_environment,
    activeCreature:     profile.active_creature,
    unlockedCreatures,
    unlockedEnvironments,
    inventory,
    totalPoints:        pts?.total_points    ?? 0,
    lifetimePoints:     pts?.lifetime_points ?? 0,
  };
}

// ─── Spend points ─────────────────────────────────────────────────────────────

function deductPoints(userId: string, cost: number): boolean {
  const db = getDb();
  ensureRewardPoints(userId);
  const pts = db.prepare(`SELECT total_points FROM reward_points WHERE user_id = ?`).get(userId) as any;
  if (!pts || pts.total_points < cost) return false;
  db.prepare(`UPDATE reward_points SET total_points = total_points - ?, updated_at = datetime('now') WHERE user_id = ?`).run(cost, userId);
  return true;
}

// ─── Unlock creature ─────────────────────────────────────────────────────────

export function unlockCreature(userId: string, creatureId: string): { ok: boolean; error?: string } {
  const creature = CREATURES.find(c => c.id === creatureId);
  if (!creature) return { ok: false, error: "Unknown creature" };

  ensureGameProfile(userId);
  const db = getDb();
  const profile = db.prepare(`SELECT unlocked_creatures FROM game_profiles WHERE user_id = ?`).get(userId) as any;
  const owned: string[] = JSON.parse(profile.unlocked_creatures || "[]");

  if (owned.includes(creatureId)) return { ok: false, error: "Already owned" };
  if (!deductPoints(userId, creature.unlockCost)) return { ok: false, error: "Not enough points" };

  owned.push(creatureId);
  db.prepare(`UPDATE game_profiles SET unlocked_creatures = ?, updated_at = datetime('now') WHERE user_id = ?`).run(JSON.stringify(owned), userId);
  return { ok: true };
}

// ─── Unlock environment ───────────────────────────────────────────────────────

export function unlockEnvironment(userId: string, envId: string): { ok: boolean; error?: string } {
  const env = ENVIRONMENTS.find(e => e.id === envId);
  if (!env) return { ok: false, error: "Unknown environment" };
  if (env.unlockCost === 0) return { ok: false, error: "Already available" };

  ensureGameProfile(userId);
  const db = getDb();
  const profile = db.prepare(`SELECT level, unlocked_environments FROM game_profiles WHERE user_id = ?`).get(userId) as any;

  if (profile.level < env.requiredLevel) return { ok: false, error: `Requires level ${env.requiredLevel}` };

  const owned: string[] = JSON.parse(profile.unlocked_environments || '["healthy_forest"]');
  if (owned.includes(envId)) return { ok: false, error: "Already unlocked" };
  if (!deductPoints(userId, env.unlockCost)) return { ok: false, error: "Not enough points" };

  owned.push(envId);
  db.prepare(`UPDATE game_profiles SET unlocked_environments = ?, updated_at = datetime('now') WHERE user_id = ?`).run(JSON.stringify(owned), userId);
  return { ok: true };
}

// ─── Set active creature / environment ───────────────────────────────────────

export function setActiveCreature(userId: string, creatureId: string | null): { ok: boolean; error?: string } {
  ensureGameProfile(userId);
  const db = getDb();

  if (creatureId !== null) {
    const profile = db.prepare(`SELECT unlocked_creatures FROM game_profiles WHERE user_id = ?`).get(userId) as any;
    const owned: string[] = JSON.parse(profile.unlocked_creatures || "[]");
    if (!owned.includes(creatureId)) return { ok: false, error: "Creature not owned" };
  }

  db.prepare(`UPDATE game_profiles SET active_creature = ?, updated_at = datetime('now') WHERE user_id = ?`).run(creatureId, userId);
  return { ok: true };
}

export function setActiveEnvironment(userId: string, envId: string): { ok: boolean; error?: string } {
  ensureGameProfile(userId);
  const db = getDb();
  const profile = db.prepare(`SELECT unlocked_environments FROM game_profiles WHERE user_id = ?`).get(userId) as any;
  const owned: string[] = JSON.parse(profile.unlocked_environments || '["healthy_forest"]');
  if (!owned.includes(envId)) return { ok: false, error: "Environment not unlocked" };

  db.prepare(`UPDATE game_profiles SET active_environment = ?, updated_at = datetime('now') WHERE user_id = ?`).run(envId, userId);
  return { ok: true };
}

// ─── Mystery eggs ─────────────────────────────────────────────────────────────

function rollRarity(probs: { common: number; uncommon: number; rare: number; legendary: number }): Rarity {
  const r = Math.random();
  if (r < probs.legendary) return "legendary";
  if (r < probs.legendary + probs.rare) return "rare";
  if (r < probs.legendary + probs.rare + probs.uncommon) return "uncommon";
  return "common";
}

function pickCreatureByRarity(rarity: Rarity, owned: string[]): typeof CREATURES[0] | null {
  const pool = CREATURES.filter(c => c.rarity === rarity && !owned.includes(c.id));
  if (pool.length === 0) {
    // Fallback to lower rarity if all of that rarity are owned
    const rarityOrder: Rarity[] = ["legendary", "rare", "uncommon", "common"];
    const idx = rarityOrder.indexOf(rarity);
    for (let i = idx + 1; i < rarityOrder.length; i++) {
      const fallback = CREATURES.filter(c => c.rarity === rarityOrder[i] && !owned.includes(c.id));
      if (fallback.length > 0) return fallback[Math.floor(Math.random() * fallback.length)];
    }
    return null; // all creatures owned
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function openMysteryEgg(userId: string, eggTier: string): {
  ok: boolean;
  error?: string;
  creature?: typeof CREATURES[0];
  rarity?: Rarity;
  isNew?: boolean;
} {
  const tier = EGG_TIERS.find(e => e.id === eggTier);
  if (!tier) return { ok: false, error: "Unknown egg tier" };

  ensureGameProfile(userId);
  const db = getDb();
  const profile = db.prepare(`SELECT unlocked_creatures FROM game_profiles WHERE user_id = ?`).get(userId) as any;
  const owned: string[] = JSON.parse(profile.unlocked_creatures || "[]");

  if (!deductPoints(userId, tier.cost)) return { ok: false, error: "Not enough points" };

  const rarity  = rollRarity(tier.probs);
  const creature = pickCreatureByRarity(rarity, owned);

  if (!creature) {
    // All creatures owned — refund and give bonus points instead
    const db2 = getDb();
    db2.prepare(`UPDATE reward_points SET total_points = total_points + ?, updated_at = datetime('now') WHERE user_id = ?`).run(tier.cost, userId);
    return { ok: true, rarity, isNew: false };
  }

  // Add to inventory as a duplicate, or directly unlock
  const isNew = !owned.includes(creature.id);
  if (isNew) {
    owned.push(creature.id);
    db.prepare(`UPDATE game_profiles SET unlocked_creatures = ?, updated_at = datetime('now') WHERE user_id = ?`).run(JSON.stringify(owned), userId);
  } else {
    // Duplicate → add to inventory as a collectible
    const inventory: any[] = JSON.parse(profile.inventory || "[]");
    inventory.push({ creatureId: creature.id, obtainedAt: new Date().toISOString() });
    db.prepare(`UPDATE game_profiles SET inventory = ?, updated_at = datetime('now') WHERE user_id = ?`).run(JSON.stringify(inventory), userId);
  }

  return { ok: true, creature, rarity, isNew };
}
