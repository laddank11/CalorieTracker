import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/getSession";

const DEFAULTS = {
  calorie_goal: 2000,
  protein_goal: 150,
  carbs_goal: 250,
  fat_goal: 65,
  water_goal: 3000,
  weight: null,
  height: null,
  activity_level: "moderately_active",
  goal_type: "maintain_weight",
};

const ALLOWED_KEYS = Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[];

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const row = db.prepare(`SELECT * FROM user_settings WHERE user_id = ?`).get(session.userId) as any;

  if (!row) {
    db.prepare(`INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)`).run(session.userId);
    return NextResponse.json({ userId: session.userId, ...DEFAULTS });
  }

  return NextResponse.json({
    userId: row.user_id,
    calorie_goal: row.calorie_goal,
    protein_goal: row.protein_goal,
    carbs_goal: row.carbs_goal,
    fat_goal: row.fat_goal,
    water_goal: row.water_goal,
    weight: row.weight,
    height: row.height,
    activity_level: row.activity_level,
    goal_type: row.goal_type,
  });
}

export async function PATCH(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const key of ALLOWED_KEYS) {
    if (key in body) {
      updates.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (updates.length > 0) {
    updates.push(`updated_at = datetime('now')`);
    db.prepare(
      `INSERT INTO user_settings (user_id) VALUES (?)
       ON CONFLICT(user_id) DO UPDATE SET ${updates.join(", ")}`
    ).run(session.userId, ...values);
  }

  return NextResponse.json({ ok: true });
}
