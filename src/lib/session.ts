import { randomBytes } from "crypto";
import { getDb } from "./db";
import type { User } from "@/types/auth";

const SESSION_DAYS = 30;

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function generateId(): string {
  return randomBytes(16).toString("hex");
}

export function createSession(userId: string): { token: string; expiresAt: string } {
  const db = getDb();
  const token = generateToken();
  const id = generateId();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000).toISOString();

  db.prepare(
    `INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`
  ).run(id, userId, token, expiresAt);

  return { token, expiresAt };
}

export function validateSession(token: string): { userId: string; user: User } | null {
  if (!token) return null;
  const db = getDb();

  const row = db.prepare(`
    SELECT s.user_id,
           u.id, u.username, u.email, u.display_name, u.profile_image, u.created_at, u.updated_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).get(token) as any;

  if (!row) return null;

  return {
    userId: row.user_id,
    user: {
      id: row.id,
      username: row.username,
      email: row.email,
      displayName: row.display_name,
      profileImage: row.profile_image,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
}

export function deleteSession(token: string): void {
  getDb().prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
}

export function pruneExpiredSessions(): void {
  getDb().prepare(`DELETE FROM sessions WHERE expires_at <= datetime('now')`).run();
}
