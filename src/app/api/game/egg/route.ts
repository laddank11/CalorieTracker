import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { openMysteryEgg } from "@/lib/game/game";
import { getGameProfile } from "@/lib/game/game";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tier } = await req.json();
  if (!tier) return NextResponse.json({ error: "tier required" }, { status: 400 });

  const result = openMysteryEgg(session.userId, tier);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const profile = getGameProfile(session.userId);
  return NextResponse.json({ ...result, totalPoints: profile.totalPoints });
}
