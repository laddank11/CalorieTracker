import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { getGameProfile, setActiveCreature, setActiveEnvironment } from "@/lib/game/game";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(getGameProfile(session.userId));
}

export async function PATCH(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if ("activeCreature" in body) {
    const result = setActiveCreature(session.userId, body.activeCreature);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  }

  if ("activeEnvironment" in body) {
    const result = setActiveEnvironment(session.userId, body.activeEnvironment);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(getGameProfile(session.userId));
}
