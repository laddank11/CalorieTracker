import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/getSession";

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user: session.user });
}

export async function PATCH(req: NextRequest) {
  const session = getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();
  const updates: string[] = [];
  const values: unknown[] = [];

  if (typeof body.displayName === "string") { updates.push("display_name = ?"); values.push(body.displayName.trim()); }
  if (typeof body.profileImage === "string") { updates.push("profile_image = ?"); values.push(body.profileImage); }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(session.userId);
    db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  }

  const row = db.prepare(`
    SELECT id, username, email, display_name, profile_image, created_at, updated_at
    FROM users WHERE id = ?
  `).get(session.userId) as any;

  return NextResponse.json({
    user: {
      id: row.id,
      username: row.username,
      email: row.email,
      displayName: row.display_name,
      profileImage: row.profile_image,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  });
}
