import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/getSession";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const days = Math.min(90, Math.max(7, parseInt(req.nextUrl.searchParams.get("days") ?? "30")));
  const db = getDb();

  const rows = db
    .prepare(
      `SELECT
         date,
         ROUND(SUM(calories * quantity))   AS calories,
         ROUND(SUM(protein  * quantity), 1) AS protein,
         ROUND(SUM(carbs    * quantity), 1) AS carbs,
         ROUND(SUM(fat      * quantity), 1) AS fat,
         COUNT(*)                           AS entries
       FROM food_log
       WHERE date >= date('now', ?) AND user_id = ?
       GROUP BY date
       ORDER BY date ASC`
    )
    .all(`-${days - 1} days`, session.userId);

  return NextResponse.json({ stats: rows });
}
