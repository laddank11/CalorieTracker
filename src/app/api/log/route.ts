import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/getSession";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM food_log WHERE date = ? AND user_id = ? ORDER BY created_at ASC`)
    .all(date, session.userId);
  return NextResponse.json({ entries: rows });
}

export async function DELETE(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const db = getDb();
  const result = db
    .prepare(`DELETE FROM food_log WHERE date = ? AND user_id = ?`)
    .run(date, session.userId);
  return NextResponse.json({ deleted: result.changes });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { food_name, calories, protein, carbs, fat, serving_size, quantity, date, meal_category } = body;

  if (!food_name || calories == null) {
    return NextResponse.json({ error: "food_name and calories are required" }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO food_log (food_name, calories, protein, carbs, fat, serving_size, quantity, date, meal_category, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      food_name,
      Number(calories),
      Number(protein ?? 0),
      Number(carbs ?? 0),
      Number(fat ?? 0),
      serving_size ?? "",
      Number(quantity ?? 1),
      date ?? new Date().toISOString().slice(0, 10),
      meal_category ?? "Snack",
      session.userId
    );

  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
