import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { getRewardHistory } from "@/lib/game/rewards";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50");
  return NextResponse.json({ history: await getRewardHistory(session.userId, limit) });
}
