import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createSession } from "@/lib/session";
import { COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, email, password } = await req.json();

  if (!username?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const db = getDb();
  const conflict = db
    .prepare(`SELECT id FROM users WHERE email = ? OR username = ?`)
    .get(email.toLowerCase(), username.trim());
  if (conflict) {
    return NextResponse.json({ error: "Email or username already in use" }, { status: 409 });
  }

  const id = randomBytes(16).toString("hex");
  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();
  const displayName = username.trim();

  db.prepare(`
    INSERT INTO users (id, username, email, display_name, profile_image, password_hash, password_salt, created_at, updated_at)
    VALUES (?, ?, ?, ?, '', ?, ?, ?, ?)
  `).run(id, username.trim(), email.toLowerCase(), displayName, hash, salt, now, now);

  db.prepare(`INSERT INTO user_settings (user_id) VALUES (?)`).run(id);

  const { token } = createSession(id);

  const user = { id, username: username.trim(), email: email.toLowerCase(), displayName, profileImage: "", createdAt: now, updatedAt: now };

  const res = NextResponse.json({ user }, { status: 201 });
  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return res;
}
