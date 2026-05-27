import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { getAvatar, equipItem, unequipItem, updateMood } from "@/lib/game/avatar";
import type { Category, Mood } from "@/lib/game/catalog";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getAvatar(session.userId));
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.action === "equip" && body.itemId) {
    try {
      const result = await equipItem(session.userId, body.itemId as string);
      return NextResponse.json(result);
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  }

  if (body.action === "unequip" && body.category) {
    await unequipItem(session.userId, body.category as Category);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "mood" && body.mood) {
    await updateMood(session.userId, body.mood as Mood);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
