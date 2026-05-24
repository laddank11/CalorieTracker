import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email?.trim() || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const db = getDb();
  const row = db.prepare(`
    SELECT id, username, email, display_name, profile_image,
           password_hash, password_salt, created_at, updated_at
    FROM users WHERE email = ?
  `).get(email.toLowerCase()) as any;

  if (!row || !verifyPassword(password, row.password_hash, row.password_salt)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const { token } = createSession(row.id);

  const user = {
    id: row.id,
    username: row.username,
    email: row.email,
    displayName: row.display_name,
    profileImage: row.profile_image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  const res = NextResponse.json({ user });
  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return res;
}
