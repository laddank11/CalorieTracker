import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { unlockCreature, unlockEnvironment, getGameProfile } from "@/lib/game/game";

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, id } = await req.json();

  let result: { ok: boolean; error?: string };
  if (type === "creature")     result = unlockCreature(session.userId, id);
  else if (type === "environment") result = unlockEnvironment(session.userId, id);
  else return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json(getGameProfile(session.userId));
}
