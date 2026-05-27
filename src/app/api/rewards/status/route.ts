import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { getRewardStatus } from "@/lib/game/rewards";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getRewardStatus(session.userId));
}
