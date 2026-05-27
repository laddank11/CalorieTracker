import { randomBytes } from "crypto";
import { getDb } from "../db";
import { REWARD_CONFIG, RewardType, getDailyEvents, levelFromXp } from "./catalog";

function uid() { return randomBytes(8).toString("hex"); }
function todayStr()     { return new Date().toISOString().slice(0, 10); }
function yesterdayStr() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ─── Ensure rows exist ────────────────────────────────────────────────────────

async function ensureRewardPoints(userId: string) {
  const db = await getDb();
  await db.execute({ sql: `INSERT OR IGNORE INTO reward_points (id, user_id) VALUES (?, ?)`, args: [uid(), userId] });
}

async function ensureStreak(userId: string) {
  const db = await getDb();
  await db.execute({ sql: `INSERT OR IGNORE INTO streaks (id, user_id) VALUES (?, ?)`, args: [uid(), userId] });
}

async function ensureGameProfile(userId: string) {
  const db = await getDb();
  await db.execute({ sql: `INSERT OR IGNORE INTO game_profiles (id, user_id) VALUES (?, ?)`, args: [uid(), userId] });
}

// ─── Streak management ────────────────────────────────────────────────────────

export async function updateStreak(userId: string) {
  await ensureStreak(userId);
  const db    = await getDb();
  const today     = todayStr();
  const yesterday = yesterdayStr();

  const rs  = await db.execute({ sql: `SELECT * FROM streaks WHERE user_id = ?`, args: [userId] });
  const row = rs.rows[0] as any;
  const last = row.last_completion_date as string | null;
  let current = row.current_streak as number;

  if (last === today) {
    return { current, longest: row.longest_streak as number, justHit3: false, justHit7: false, justHit30: false };
  }

  if (last === yesterday) {
    current += 1;
  } else {
    current = 1;
  }
  const longest = Math.max(row.longest_streak as number, current);

  await db.execute({
    sql:  `UPDATE streaks SET current_streak = ?, longest_streak = ?, last_completion_date = ?, updated_at = datetime('now') WHERE user_id = ?`,
    args: [current, longest, today, userId],
  });

  return { current, longest, justHit3: current === 3, justHit7: current === 7, justHit30: current === 30 };
}

export async function getStreak(userId: string) {
  await ensureStreak(userId);
  const db = await getDb();
  const rs = await db.execute({ sql: `SELECT * FROM streaks WHERE user_id = ?`, args: [userId] });
  return rs.rows[0] as any;
}

// ─── XP + level ───────────────────────────────────────────────────────────────

async function awardXp(userId: string, xp: number): Promise<{ newLevel: number; leveledUp: boolean }> {
  await ensureGameProfile(userId);
  const db = await getDb();
  const rs   = await db.execute({ sql: `SELECT experience, level FROM game_profiles WHERE user_id = ?`, args: [userId] });
  const prof = rs.rows[0] as any;
  const oldLevel = prof.level as number;
  const newXp    = (prof.experience as number) + xp;
  const newLevel = levelFromXp(newXp);
  const leveledUp = newLevel > oldLevel;

  await db.execute({
    sql:  `UPDATE game_profiles SET experience = ?, level = ?, updated_at = datetime('now') WHERE user_id = ?`,
    args: [newXp, newLevel, userId],
  });

  return { newLevel, leveledUp };
}

// ─── Core claim logic ─────────────────────────────────────────────────────────

interface AwardedReward { type: RewardType; points: number; label: string; emoji: string; }

export async function claimDailyRewards(userId: string) {
  await ensureRewardPoints(userId);
  await ensureStreak(userId);
  await ensureGameProfile(userId);

  const db    = await getDb();
  const today = todayStr();

  const logRs = await db.execute({
    sql:  `SELECT ROUND(SUM(calories*quantity)) AS calories, ROUND(SUM(protein*quantity)) AS protein,
                  ROUND(SUM(carbs*quantity)) AS carbs, ROUND(SUM(fat*quantity)) AS fat
           FROM food_log WHERE date = ? AND user_id = ?`,
    args: [today, userId],
  });
  const logRow = logRs.rows[0] as any;
  const cal    = Number(logRow?.calories ?? 0);
  const pro    = Number(logRow?.protein  ?? 0);
  const carb   = Number(logRow?.carbs    ?? 0);
  const fat    = Number(logRow?.fat      ?? 0);

  const settingsRs = await db.execute({ sql: `SELECT * FROM user_settings WHERE user_id = ?`, args: [userId] });
  const settings   = (settingsRs.rows[0] as any) ?? { calorie_goal: 2000, protein_goal: 150, carbs_goal: 250, fat_goal: 65 };

  const claimedRs = await db.execute({
    sql:  `SELECT reward_type FROM daily_rewards WHERE user_id = ? AND date_claimed = ?`,
    args: [userId, today],
  });
  const claimed = new Set(claimedRs.rows.map((r: any) => r.reward_type as string));

  const events           = getDailyEvents(today);
  const globalMultiplier = events.reduce((m, e) => m * e.multiplier, 1);
  const globalBonus      = events.reduce((b, e) => b + e.bonus, 0);

  const profileRs = await db.execute({
    sql:  `SELECT level FROM game_profiles WHERE user_id = ?`,
    args: [userId],
  });
  const profile = profileRs.rows[0] as any;

  const calMet   = cal  >= settings.calorie_goal * 0.85 && cal  <= settings.calorie_goal * 1.15;
  const proMet   = pro  >= settings.protein_goal * 0.90;
  const carbMet  = carb >= settings.carbs_goal   * 0.70 && carb <= settings.carbs_goal   * 1.15;
  const fatMet   = fat  >= settings.fat_goal     * 0.70 && fat  <= settings.fat_goal     * 1.15;
  const macrosMet = proMet && carbMet && fatMet;
  const allMet    = calMet && macrosMet;

  const candidates: { type: RewardType; basePoints: number }[] = [
    ...(calMet    ? [{ type: "calorie_goal"   as RewardType, basePoints: REWARD_CONFIG.calorie_goal.points   }] : []),
    ...(proMet    ? [{ type: "protein_goal"   as RewardType, basePoints: REWARD_CONFIG.protein_goal.points   }] : []),
    ...(carbMet   ? [{ type: "carbs_goal"     as RewardType, basePoints: REWARD_CONFIG.carbs_goal.points     }] : []),
    ...(fatMet    ? [{ type: "fat_goal"       as RewardType, basePoints: REWARD_CONFIG.fat_goal.points       }] : []),
    ...(macrosMet ? [{ type: "macro_complete" as RewardType, basePoints: REWARD_CONFIG.macro_complete.points }] : []),
    ...(allMet    ? [{ type: "all_goals"      as RewardType, basePoints: REWARD_CONFIG.all_goals.points      }] : []),
  ];

  const anyMet      = candidates.length > 0;
  const streakData  = anyMet ? await updateStreak(userId) : await getStreak(userId);
  const streakCur   = streakData.current ?? streakData.current_streak ?? 0;

  if (streakData.justHit3  && !claimed.has("streak_3"))  candidates.push({ type: "streak_3",  basePoints: REWARD_CONFIG.streak_3.points  });
  if (streakData.justHit7  && !claimed.has("streak_7"))  candidates.push({ type: "streak_7",  basePoints: REWARD_CONFIG.streak_7.points  });
  if (streakData.justHit30 && !claimed.has("streak_30")) candidates.push({ type: "streak_30", basePoints: REWARD_CONFIG.streak_30.points });

  const awarded: AwardedReward[] = [];
  let totalNewPoints = 0;

  for (const { type, basePoints } of candidates) {
    if (claimed.has(type)) continue;

    const pts = Math.round(basePoints * globalMultiplier);

    const res = await db.execute({
      sql:  `INSERT OR IGNORE INTO daily_rewards (id, user_id, reward_type, points_awarded, date_claimed) VALUES (?, ?, ?, ?, ?)`,
      args: [uid(), userId, type, pts, today],
    });

    if (res.rowsAffected > 0) {
      awarded.push({ type, points: pts, label: REWARD_CONFIG[type].label, emoji: REWARD_CONFIG[type].emoji });
      totalNewPoints += pts;
    }
  }

  if (totalNewPoints === 0 && awarded.length === 0) {
    const ptsRs   = await db.execute({ sql: `SELECT total_points, lifetime_points FROM reward_points WHERE user_id = ?`, args: [userId] });
    const pts     = ptsRs.rows[0] as any;
    return {
      awarded: [],
      totalPoints:    Number(pts?.total_points    ?? 0),
      lifetimePoints: Number(pts?.lifetime_points ?? 0),
      streak:         streakCur,
      leveledUp:      false,
      newLevel:       Number(profile?.level ?? 1),
      events,
    };
  }

  if (globalBonus > 0 && !claimed.has("all_goals" as RewardType)) {
    totalNewPoints += globalBonus;
  }

  await db.execute({
    sql:  `UPDATE reward_points SET total_points = total_points + ?, lifetime_points = lifetime_points + ?, updated_at = datetime('now') WHERE user_id = ?`,
    args: [totalNewPoints, totalNewPoints, userId],
  });

  const updRs  = await db.execute({ sql: `SELECT total_points, lifetime_points FROM reward_points WHERE user_id = ?`, args: [userId] });
  const updPts = updRs.rows[0] as any;

  const { newLevel, leveledUp } = await awardXp(userId, totalNewPoints);

  const freshRs     = await db.execute({ sql: `SELECT current_streak FROM streaks WHERE user_id = ?`, args: [userId] });
  const freshStreak = freshRs.rows[0] as any;

  return {
    awarded,
    totalPoints:    Number(updPts.total_points),
    lifetimePoints: Number(updPts.lifetime_points),
    streak:         Number(freshStreak?.current_streak ?? 0),
    leveledUp,
    newLevel,
    events,
  };
}

export async function getRewardStatus(userId: string) {
  await ensureRewardPoints(userId);
  await ensureStreak(userId);
  await ensureGameProfile(userId);

  const db    = await getDb();
  const today = todayStr();

  const [ptsRs, streakRs, profileRs, claimedRs] = await Promise.all([
    db.execute({ sql: `SELECT * FROM reward_points WHERE user_id = ?`,  args: [userId] }),
    db.execute({ sql: `SELECT * FROM streaks WHERE user_id = ?`,        args: [userId] }),
    db.execute({ sql: `SELECT * FROM game_profiles WHERE user_id = ?`,  args: [userId] }),
    db.execute({ sql: `SELECT reward_type, points_awarded FROM daily_rewards WHERE user_id = ? AND date_claimed = ?`, args: [userId, today] }),
  ]);

  const pts     = ptsRs.rows[0]     as any;
  const streak  = streakRs.rows[0]  as any;
  const profile = profileRs.rows[0] as any;
  const events  = getDailyEvents(today);

  return {
    totalPoints:    Number(pts?.total_points    ?? 0),
    lifetimePoints: Number(pts?.lifetime_points ?? 0),
    streak:         Number(streak?.current_streak  ?? 0),
    longestStreak:  Number(streak?.longest_streak  ?? 0),
    level:          Number(profile?.level       ?? 1),
    experience:     Number(profile?.experience  ?? 0),
    claimedToday:   claimedRs.rows as any[],
    events,
  };
}

export async function getRewardHistory(userId: string, limit = 30) {
  const db = await getDb();
  const rs = await db.execute({
    sql:  `SELECT dr.*, rc.label, rc.emoji FROM daily_rewards dr
           LEFT JOIN (SELECT 'calorie_goal' AS type, 'Calorie Goal' AS label, '🔥' AS emoji UNION ALL
                      SELECT 'protein_goal',  'Protein Goal',      '💪' UNION ALL
                      SELECT 'carbs_goal',    'Carbs Goal',        '🌾' UNION ALL
                      SELECT 'fat_goal',      'Fat Goal',          '🥑' UNION ALL
                      SELECT 'macro_complete','All Macros',        '⚖️' UNION ALL
                      SELECT 'all_goals',     'Perfect Day Bonus', '🏆' UNION ALL
                      SELECT 'streak_3',      '3-Day Streak',      '🔥' UNION ALL
                      SELECT 'streak_7',      '7-Day Streak',      '⚡' UNION ALL
                      SELECT 'streak_30',     '30-Day Streak',     '👑') rc ON rc.type = dr.reward_type
           WHERE dr.user_id = ? ORDER BY dr.created_at DESC LIMIT ?`,
    args: [userId, limit],
  });
  return rs.rows as any[];
}
