import { randomBytes } from "node:crypto";
import { db } from "../connection.js";

export interface AuthToken {
  token: string;
  phone_number: string;
  user_id: number | null;
  expires_at: string;
  created_at: string;
}

const TOKEN_TTL_DAYS = 90;

export function createAuthToken(phoneNumber: string, userId: number | null = null): AuthToken {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    `INSERT INTO auth_tokens (token, phone_number, user_id, expires_at) VALUES (?, ?, ?, ?)`
  ).run(token, phoneNumber, userId, expiresAt);
  return getAuthToken(token)!;
}

export function getAuthToken(token: string): AuthToken | undefined {
  return db.prepare("SELECT * FROM auth_tokens WHERE token = ?").get(token) as AuthToken | undefined;
}

export function getValidAuthToken(token: string): AuthToken | undefined {
  const row = getAuthToken(token);
  if (!row) return undefined;
  if (new Date(row.expires_at).getTime() < Date.now()) return undefined;
  return row;
}

export function bindAuthTokenToUser(token: string, userId: number): void {
  db.prepare("UPDATE auth_tokens SET user_id = ? WHERE token = ?").run(userId, token);
}
