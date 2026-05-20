import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
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
       WHERE date >= date('now', ?)
       GROUP BY date
       ORDER BY date ASC`
    )
    .all(`-${days - 1} days`);

  return NextResponse.json({ stats: rows });
}
