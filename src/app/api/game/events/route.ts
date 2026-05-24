import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { getDailyEvents } from "@/lib/game/catalog";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const today = new Date().toISOString().slice(0, 10);
  return NextResponse.json({ events: getDailyEvents(today), date: today });
}
