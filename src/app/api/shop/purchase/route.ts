import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/getSession";
import { purchaseItem } from "@/lib/game/avatar";

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await req.json();
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  try {
    const result = await purchaseItem(session.userId, itemId as string);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
