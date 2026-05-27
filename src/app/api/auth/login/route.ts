import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email?.trim() || !password)
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

  const db = await getDb();
  const rs = await db.execute({
    sql:  `SELECT id, username, email, display_name, profile_image, password_hash, password_salt, created_at, updated_at FROM users WHERE email = ?`,
    args: [email.toLowerCase()],
  });
  const row = rs.rows[0] as any;

  if (!row || !verifyPassword(password, row.password_hash as string, row.password_salt as string))
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  const { token } = await createSession(row.id as string);

  const user = {
    id:           row.id           as string,
    username:     row.username     as string,
    email:        row.email        as string,
    displayName:  row.display_name as string,
    profileImage: row.profile_image as string,
    createdAt:    row.created_at   as string,
    updatedAt:    row.updated_at   as string,
  };

  const res = NextResponse.json({ user });
  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return res;
}
