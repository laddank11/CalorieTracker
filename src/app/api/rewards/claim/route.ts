import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { claimDailyRewards } from "@/lib/game/rewards";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = claimDailyRewards(session.userId);
  return NextResponse.json(result);
}
