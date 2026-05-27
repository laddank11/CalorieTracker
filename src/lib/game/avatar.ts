import { randomBytes } from "crypto";
import { getDb } from "../db";
import { COSMETICS, CosmeticItem, Category, Mood } from "./catalog";

function uid() { return randomBytes(8).toString("hex"); }

// ─── Avatar ───────────────────────────────────────────────────────────────────

async function ensureAvatar(userId: string) {
  const db = await getDb();
  await db.execute({
    sql:  `INSERT OR IGNORE INTO nutri_avatars (id, user_id) VALUES (?, ?)`,
    args: [uid(), userId],
  });
}

export async function getAvatar(userId: string) {
  await ensureAvatar(userId);
  const db = await getDb();

  const [avatarRs, equippedRs] = await Promise.all([
    db.execute({ sql: `SELECT * FROM nutri_avatars WHERE user_id = ?`, args: [userId] }),
    db.execute({ sql: `SELECT category, item_id FROM nutri_equipped WHERE user_id = ?`, args: [userId] }),
  ]);

  const avatar  = avatarRs.rows[0]  as any;
  const equipped: Record<string, string> = {};
  for (const row of equippedRs.rows as any[]) {
    equipped[row.category as string] = row.item_id as string;
  }

  return {
    mood:     (avatar?.current_mood ?? "happy") as Mood,
    equipped,
  };
}

export async function equipItem(userId: string, itemId: string) {
  const item = COSMETICS.find(c => c.id === itemId);
  if (!item) throw new Error("Unknown item");

  const db = await getDb();

  // Must own the item (cost=0 items are always equippable without purchase)
  if (item.cost > 0) {
    const ownRs = await db.execute({
      sql:  `SELECT 1 FROM nutri_inventory WHERE user_id = ? AND item_id = ?`,
      args: [userId, itemId],
    });
    if (ownRs.rows.length === 0) throw new Error("Item not owned");
  }

  await db.execute({
    sql:  `INSERT INTO nutri_equipped (user_id, category, item_id) VALUES (?, ?, ?)
           ON CONFLICT (user_id, category) DO UPDATE SET item_id = excluded.item_id, updated_at = datetime('now')`,
    args: [userId, item.category, itemId],
  });

  return { category: item.category, item_id: itemId };
}

export async function unequipItem(userId: string, category: Category) {
  const db = await getDb();
  await db.execute({
    sql:  `DELETE FROM nutri_equipped WHERE user_id = ? AND category = ?`,
    args: [userId, category],
  });
}

export async function updateMood(userId: string, mood: Mood) {
  await ensureAvatar(userId);
  const db = await getDb();
  await db.execute({
    sql:  `UPDATE nutri_avatars SET current_mood = ?, updated_at = datetime('now') WHERE user_id = ?`,
    args: [mood, userId],
  });
}

// ─── Shop ─────────────────────────────────────────────────────────────────────

export function getItems(): CosmeticItem[] {
  return COSMETICS;
}

export async function getInventory(userId: string): Promise<string[]> {
  const db = await getDb();
  const rs = await db.execute({
    sql:  `SELECT item_id FROM nutri_inventory WHERE user_id = ?`,
    args: [userId],
  });
  return rs.rows.map((r: any) => r.item_id as string);
}

export async function purchaseItem(userId: string, itemId: string) {
  const item = COSMETICS.find(c => c.id === itemId);
  if (!item) throw new Error("Unknown item");
  if (item.cost === 0) throw new Error("Item is free — equip directly");

  const db = await getDb();

  // Check already owned
  const ownRs = await db.execute({
    sql:  `SELECT 1 FROM nutri_inventory WHERE user_id = ? AND item_id = ?`,
    args: [userId, itemId],
  });
  if (ownRs.rows.length > 0) throw new Error("Already owned");

  // Check balance
  const ptsRs = await db.execute({
    sql:  `SELECT total_points FROM reward_points WHERE user_id = ?`,
    args: [userId],
  });
  const totalPoints = Number((ptsRs.rows[0] as any)?.total_points ?? 0);
  if (totalPoints < item.cost) throw new Error("Insufficient points");

  // Deduct points
  await db.execute({
    sql:  `UPDATE reward_points SET total_points = total_points - ?, updated_at = datetime('now') WHERE user_id = ?`,
    args: [item.cost, userId],
  });

  // Add to inventory
  await db.execute({
    sql:  `INSERT INTO nutri_inventory (id, user_id, item_id) VALUES (?, ?, ?)`,
    args: [uid(), userId, itemId],
  });

  const updRs = await db.execute({
    sql:  `SELECT total_points FROM reward_points WHERE user_id = ?`,
    args: [userId],
  });

  return {
    item,
    remainingPoints: Number((updRs.rows[0] as any)?.total_points ?? 0),
  };
}
