import { NextRequest, NextResponse } from "next/server";
import type { InValue } from "@libsql/client";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/getSession";

const DEFAULTS = {
  calorie_goal:   2000,
  protein_goal:   150,
  carbs_goal:     250,
  fat_goal:       65,
  water_goal:     3000,
  weight:         null as number | null,
  height:         null as number | null,
  activity_level: "moderately_active",
  goal_type:      "maintain_weight",
};

const ALLOWED_KEYS = Object.keys(DEFAULTS) as (keyof typeof DEFAULTS)[];

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const rs = await db.execute({ sql: `SELECT * FROM user_settings WHERE user_id = ?`, args: [session.userId] });
  const row = rs.rows[0] as any;

  if (!row) {
    await db.execute({ sql: `INSERT OR IGNORE INTO user_settings (user_id) VALUES (?)`, args: [session.userId] });
    return NextResponse.json({ userId: session.userId, ...DEFAULTS });
  }

  return NextResponse.json({
    userId:         row.user_id,
    calorie_goal:   Number(row.calorie_goal),
    protein_goal:   Number(row.protein_goal),
    carbs_goal:     Number(row.carbs_goal),
    fat_goal:       Number(row.fat_goal),
    water_goal:     Number(row.water_goal),
    weight:         row.weight  != null ? Number(row.weight)  : null,
    height:         row.height  != null ? Number(row.height)  : null,
    activity_level: row.activity_level,
    goal_type:      row.goal_type,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body    = await req.json();
  const db      = await getDb();
  const setCols: string[]  = [];
  const args:    InValue[] = [];

  for (const key of ALLOWED_KEYS) {
    if (key in body) {
      setCols.push(`${key} = ?`);
      args.push(body[key]);
    }
  }

  if (setCols.length > 0) {
    setCols.push(`updated_at = datetime('now')`);
    await db.execute({
      sql:  `INSERT INTO user_settings (user_id) VALUES (?)
             ON CONFLICT(user_id) DO UPDATE SET ${setCols.join(", ")}`,
      args: [session.userId, ...args],
    });
  }

  return NextResponse.json({ ok: true });
}
