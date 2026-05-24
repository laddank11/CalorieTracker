import { randomBytes } from "crypto";
import { getDb } from "../db";
import { REWARD_CONFIG, RewardType, getDailyEvents, levelFromXp, totalXpForLevel, CREATURES } from "./catalog";

function uid() { return randomBytes(8).toString("hex"); }

function todayStr() { return new Date().toISOString().slice(0, 10); }

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ─── Ensure rows exist (lazy init) ───────────────────────────────────────────

function ensureRewardPoints(userId: string) {
  getDb().prepare(
    `INSERT OR IGNORE INTO reward_points (id, user_id) VALUES (?, ?)`
  ).run(uid(), userId);
}

function ensureStreak(userId: string) {
  getDb().prepare(
    `INSERT OR IGNORE INTO streaks (id, user_id) VALUES (?, ?)`
  ).run(uid(), userId);
}

function ensureGameProfile(userId: string) {
  getDb().prepare(
    `INSERT OR IGNORE INTO game_profiles (id, user_id) VALUES (?, ?)`
  ).run(uid(), userId);
}

// ─── Streak management ────────────────────────────────────────────────────────

export function updateStreak(userId: string): { current: number; longest: number; justHit3: boolean; justHit7: boolean; justHit30: boolean } {
  ensureStreak(userId);
  const db = getDb();
  const today = todayStr();
  const yesterday = yesterdayStr();

  const row = db.prepare(`SELECT * FROM streaks WHERE user_id = ?`).get(userId) as any;
  const last = row.last_completion_date;

  let current = row.current_streak;

  if (last === today) {
    // Already counted today
    return { current, longest: row.longest_streak, justHit3: false, justHit7: false, justHit30: false };
  }

  if (last === yesterday) {
    current += 1;
  } else if (last === null || last < yesterday) {
    current = 1; // streak broken (unless Water Spirit creature owned — handled in claim)
  }

  const longest = Math.max(row.longest_streak, current);

  db.prepare(`
    UPDATE streaks SET current_streak = ?, longest_streak = ?, last_completion_date = ?, updated_at = datetime('now')
    WHERE user_id = ?
  `).run(current, longest, today, userId);

  return {
    current,
    longest,
    justHit3:  current === 3,
    justHit7:  current === 7,
    justHit30: current === 30,
  };
}

export function getStreak(userId: string) {
  ensureStreak(userId);
  return getDb().prepare(`SELECT * FROM streaks WHERE user_id = ?`).get(userId) as any;
}

// ─── XP + level management ────────────────────────────────────────────────────

function awardXp(userId: string, xp: number): { newLevel: number; leveledUp: boolean } {
  ensureGameProfile(userId);
  const db = getDb();
  const profile = db.prepare(`SELECT experience, level FROM game_profiles WHERE user_id = ?`).get(userId) as any;
  const oldLevel = profile.level;
  const newXp = profile.experience + xp;
  const newLevel = levelFromXp(newXp);
  const leveledUp = newLevel > oldLevel;

  db.prepare(`
    UPDATE game_profiles SET experience = ?, level = ?, updated_at = datetime('now') WHERE user_id = ?
  `).run(newXp, newLevel, userId);

  return { newLevel, leveledUp };
}

// ─── Core claim logic ────────────────────────────────────────────────────────

interface AwardedReward {
  type: RewardType;
  points: number;
  label: string;
  emoji: string;
}

export function claimDailyRewards(userId: string): {
  awarded: AwardedReward[];
  totalPoints: number;
  lifetimePoints: number;
  streak: number;
  leveledUp: boolean;
  newLevel: number;
  events: ReturnType<typeof getDailyEvents>;
} {
  ensureRewardPoints(userId);
  ensureStreak(userId);
  ensureGameProfile(userId);

  const db = getDb();
  const today = todayStr();

  // Get today's log totals
  const logRow = db.prepare(`
    SELECT
      ROUND(SUM(calories * quantity)) AS calories,
      ROUND(SUM(protein  * quantity)) AS protein,
      ROUND(SUM(carbs    * quantity)) AS carbs,
      ROUND(SUM(fat      * quantity)) AS fat
    FROM food_log WHERE date = ? AND user_id = ?
  `).get(today, userId) as any;

  const cal  = logRow?.calories ?? 0;
  const pro  = logRow?.protein  ?? 0;
  const carb = logRow?.carbs    ?? 0;
  const fat  = logRow?.fat      ?? 0;

  // Get user goals
  const settings = db.prepare(`SELECT * FROM user_settings WHERE user_id = ?`).get(userId) as any ?? {
    calorie_goal: 2000, protein_goal: 150, carbs_goal: 250, fat_goal: 65
  };

  // What has already been claimed today
  const claimed = new Set(
    (db.prepare(`SELECT reward_type FROM daily_rewards WHERE user_id = ? AND date_claimed = ?`).all(userId, today) as any[])
      .map(r => r.reward_type)
  );

  // Daily events (multipliers, bonus points)
  const events = getDailyEvents(today);
  const globalMultiplier = events.reduce((m, e) => m * e.multiplier, 1);
  const globalBonus      = events.reduce((b, e) => b + e.bonus, 0);

  // Check active creature bonuses
  const profile = db.prepare(`SELECT active_creature, unlocked_creatures FROM game_profiles WHERE user_id = ?`).get(userId) as any;
  const activeCreature = profile?.active_creature ?? null;
  const creature = activeCreature ? CREATURES.find(c => c.id === activeCreature) : null;

  // Goal checks
  const calMet  = cal  >= settings.calorie_goal * 0.85 && cal  <= settings.calorie_goal * 1.15;
  const proMet  = pro  >= settings.protein_goal * 0.90;
  const carbMet = carb >= settings.carbs_goal   * 0.70 && carb <= settings.carbs_goal   * 1.15;
  const fatMet  = fat  >= settings.fat_goal     * 0.70 && fat  <= settings.fat_goal     * 1.15;
  const macrosMet = proMet && carbMet && fatMet;
  const allMet    = calMet && macrosMet;

  // Build candidate rewards
  const candidates: { type: RewardType; basePoints: number }[] = [
    ...(calMet   ? [{ type: "calorie_goal"   as RewardType, basePoints: REWARD_CONFIG.calorie_goal.points   }] : []),
    ...(proMet   ? [{ type: "protein_goal"   as RewardType, basePoints: REWARD_CONFIG.protein_goal.points   }] : []),
    ...(carbMet  ? [{ type: "carbs_goal"     as RewardType, basePoints: REWARD_CONFIG.carbs_goal.points     }] : []),
    ...(fatMet   ? [{ type: "fat_goal"       as RewardType, basePoints: REWARD_CONFIG.fat_goal.points       }] : []),
    ...(macrosMet ? [{ type: "macro_complete" as RewardType, basePoints: REWARD_CONFIG.macro_complete.points }] : []),
    ...(allMet    ? [{ type: "all_goals"      as RewardType, basePoints: REWARD_CONFIG.all_goals.points      }] : []),
  ];

  // Update streak if any goal is met
  const anyMet = candidates.length > 0;
  const streakData = anyMet ? updateStreak(userId) : getStreak(userId);

  // Add streak milestone rewards
  if (streakData.justHit3  && !claimed.has("streak_3"))  candidates.push({ type: "streak_3",  basePoints: REWARD_CONFIG.streak_3.points  });
  if (streakData.justHit7  && !claimed.has("streak_7"))  candidates.push({ type: "streak_7",  basePoints: REWARD_CONFIG.streak_7.points  });
  if (streakData.justHit30 && !claimed.has("streak_30")) candidates.push({ type: "streak_30", basePoints: REWARD_CONFIG.streak_30.points });

  const awarded: AwardedReward[] = [];
  let totalNewPoints = 0;

  const insertReward = db.prepare(`
    INSERT OR IGNORE INTO daily_rewards (id, user_id, reward_type, points_awarded, date_claimed)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const { type, basePoints } of candidates) {
    if (claimed.has(type)) continue;

    let pts = Math.round(basePoints * globalMultiplier);

    // Creature bonuses
    if (creature) {
      if (creature.id === "cosmos_unicorn") pts = Math.round(pts * 1.25);
      if (creature.id === "protein_dragon" && type === "protein_goal") pts *= 2;
      if (creature.id === "vitamin_owl"    && type === "calorie_goal")  pts += 5;
      if (creature.id === "fiber_fox"      && type === "all_goals")     pts += 10;
      if (creature.id === "luna_wolf"      && type === "all_goals")     pts += 20;
      if (creature.id === "omega_fish"     && type === "fat_goal")      pts += 10;
      if (creature.id === "carb_cheetah"   && ["streak_3","streak_7","streak_30"].includes(type)) pts = Math.round(pts * 1.10);
      if (creature.id === "calorie_phoenix" && type === "all_goals")    pts += 50;
    }

    const result = insertReward.run(uid(), userId, type, pts, today);
    if (result.changes > 0) {
      awarded.push({ type, points: pts, label: REWARD_CONFIG[type].label, emoji: REWARD_CONFIG[type].emoji });
      totalNewPoints += pts;
    }
  }

  if (totalNewPoints === 0 && awarded.length === 0) {
    const pts = db.prepare(`SELECT total_points, lifetime_points FROM reward_points WHERE user_id = ?`).get(userId) as any;
    return {
      awarded: [],
      totalPoints: pts?.total_points ?? 0,
      lifetimePoints: pts?.lifetime_points ?? 0,
      streak: streakData.current_streak ?? 0,
      leveledUp: false,
      newLevel: profile?.level ?? 1,
      events,
    };
  }

  // Add event bonus once per day if it hasn't been added
  if (globalBonus > 0 && !claimed.has("all_goals" as RewardType)) {
    totalNewPoints += globalBonus;
  }

  // Update reward_points
  db.prepare(`
    UPDATE reward_points
    SET total_points = total_points + ?, lifetime_points = lifetime_points + ?, updated_at = datetime('now')
    WHERE user_id = ?
  `).run(totalNewPoints, totalNewPoints, userId);

  const updatedPts = db.prepare(`SELECT total_points, lifetime_points FROM reward_points WHERE user_id = ?`).get(userId) as any;

  // Award XP (1 XP per point)
  const { newLevel, leveledUp } = awardXp(userId, totalNewPoints);

  const freshStreak = db.prepare(`SELECT current_streak FROM streaks WHERE user_id = ?`).get(userId) as any;

  return {
    awarded,
    totalPoints: updatedPts.total_points,
    lifetimePoints: updatedPts.lifetime_points,
    streak: freshStreak?.current_streak ?? 0,
    leveledUp,
    newLevel,
    events,
  };
}

export function getRewardStatus(userId: string) {
  ensureRewardPoints(userId);
  ensureStreak(userId);
  ensureGameProfile(userId);

  const db = getDb();
  const today = todayStr();

  const pts     = db.prepare(`SELECT * FROM reward_points WHERE user_id = ?`).get(userId) as any;
  const streak  = db.prepare(`SELECT * FROM streaks WHERE user_id = ?`).get(userId) as any;
  const profile = db.prepare(`SELECT * FROM game_profiles WHERE user_id = ?`).get(userId) as any;

  const claimedToday = (db.prepare(
    `SELECT reward_type, points_awarded FROM daily_rewards WHERE user_id = ? AND date_claimed = ?`
  ).all(userId, today) as any[]);

  const events = getDailyEvents(today);

  return {
    totalPoints:    pts?.total_points    ?? 0,
    lifetimePoints: pts?.lifetime_points ?? 0,
    streak:         streak?.current_streak  ?? 0,
    longestStreak:  streak?.longest_streak  ?? 0,
    level:          profile?.level       ?? 1,
    experience:     profile?.experience  ?? 0,
    claimedToday,
    events,
  };
}

export function getRewardHistory(userId: string, limit = 30) {
  return getDb()
    .prepare(`SELECT * FROM daily_rewards WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`)
    .all(userId, limit) as any[];
}
