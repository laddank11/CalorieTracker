import { randomBytes } from "crypto";
import { getDb } from "./db";
import type { User } from "@/types/auth";

const SESSION_DAYS = 30;

function generateToken() { return randomBytes(32).toString("hex"); }
function generateId()    { return randomBytes(16).toString("hex"); }

export async function createSession(userId: string): Promise<{ token: string; expiresAt: string }> {
  const db = await getDb();
  const token     = generateToken();
  const id        = generateId();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000).toISOString();

  await db.execute({
    sql:  `INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)`,
    args: [id, userId, token, expiresAt],
  });

  return { token, expiresAt };
}

export async function validateSession(token: string): Promise<{ userId: string; user: User } | null> {
  if (!token) return null;
  try {
    const db = await getDb();

    const rs = await db.execute({
      sql: `SELECT s.user_id,
                   u.id, u.username, u.email, u.display_name, u.profile_image, u.created_at, u.updated_at
            FROM sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token = ? AND s.expires_at > datetime('now')`,
      args: [token],
    });

    const row = rs.rows[0] as any;
    if (!row) return null;

    return {
      userId: row.user_id as string,
      user: {
        id:           row.id            as string,
        username:     row.username      as string,
        email:        row.email         as string,
        displayName:  row.display_name  as string,
        profileImage: row.profile_image as string,
        createdAt:    row.created_at    as string,
        updatedAt:    row.updated_at    as string,
      },
    };
  } catch {
    return null;
  }
}

export async function deleteSession(token: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: `DELETE FROM sessions WHERE token = ?`, args: [token] });
}

export async function pruneExpiredSessions(): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: `DELETE FROM sessions WHERE expires_at <= datetime('now')`, args: [] });
}
