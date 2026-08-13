import { db } from "../connection.js";

export type Direction = "inbound" | "outbound";

export interface ChatMessage {
  id: number;
  phone_number: string;
  direction: Direction;
  body: string;
  created_at: string;
}

export function logMessage(phone: string, direction: Direction, body: string): void {
  db.prepare("INSERT INTO chat_messages (phone_number, direction, body) VALUES (?, ?, ?)").run(
    phone,
    direction,
    body
  );
}

export function getHistory(phone: string): ChatMessage[] {
  return db
    .prepare("SELECT * FROM chat_messages WHERE phone_number = ? ORDER BY created_at ASC, id ASC")
    .all(phone) as ChatMessage[];
}
