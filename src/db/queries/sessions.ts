import { db } from "../connection.js";

export interface BotSessionRow {
  phone_number: string;
  user_id: number | null;
  state: string;
  context_json: string;
  updated_at: string;
}

export function getSession(phone: string): BotSessionRow | undefined {
  return db.prepare("SELECT * FROM bot_sessions WHERE phone_number = ?").get(phone) as
    | BotSessionRow
    | undefined;
}

export function getOrCreateSession(phone: string): BotSessionRow {
  const existing = getSession(phone);
  if (existing) return existing;
  db.prepare(
    "INSERT INTO bot_sessions (phone_number, state, context_json) VALUES (?, 'WELCOME', '{}')"
  ).run(phone);
  return getSession(phone)!;
}

export function saveSession(
  phone: string,
  state: string,
  context: object,
  userId: number | null
): void {
  db.prepare(
    `UPDATE bot_sessions
     SET state = ?, context_json = ?, user_id = COALESCE(?, user_id), updated_at = datetime('now')
     WHERE phone_number = ?`
  ).run(state, JSON.stringify(context), userId, phone);
}
