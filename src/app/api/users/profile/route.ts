import { NextRequest, NextResponse } from "next/server";
import type { InValue } from "@libsql/client";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/getSession";

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user: session.user });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body    = await req.json();
  const db      = await getDb();
  const setCols: string[]  = [];
  const args:    InValue[] = [];

  if (typeof body.displayName  === "string") { setCols.push("display_name = ?");  args.push(body.displayName.trim()); }
  if (typeof body.profileImage === "string") { setCols.push("profile_image = ?"); args.push(body.profileImage); }

  if (setCols.length > 0) {
    setCols.push("updated_at = datetime('now')");
    await db.execute({
      sql:  `UPDATE users SET ${setCols.join(", ")} WHERE id = ?`,
      args: [...args, session.userId],
    });
  }

  const rs  = await db.execute({
    sql:  `SELECT id, username, email, display_name, profile_image, created_at, updated_at FROM users WHERE id = ?`,
    args: [session.userId],
  });
  const row = rs.rows[0] as any;

  return NextResponse.json({
    user: {
      id:           row.id           as string,
      username:     row.username     as string,
      email:        row.email        as string,
      displayName:  row.display_name as string,
      profileImage: row.profile_image as string,
      createdAt:    row.created_at   as string,
      updatedAt:    row.updated_at   as string,
    },
  });
}
