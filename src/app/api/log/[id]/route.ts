import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/getSession";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = await getDb();
  const rs = await db.execute({
    sql:  `DELETE FROM food_log WHERE id = ? AND user_id = ?`,
    args: [Number(id), session.userId],
  });

  if (rs.rowsAffected === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  if (body.quantity == null)
    return NextResponse.json({ error: "quantity required" }, { status: 400 });

  const db = await getDb();
  const rs = await db.execute({
    sql:  `UPDATE food_log SET quantity = ? WHERE id = ? AND user_id = ?`,
    args: [Number(body.quantity), Number(id), session.userId],
  });

  if (rs.rowsAffected === 0)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
