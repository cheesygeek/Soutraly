import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { db } from "./connection.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ADDED_COLUMNS: Array<{ table: string; column: string; ddl: string }> = [
  { table: "users", column: "kyc_media_filename", ddl: "ALTER TABLE users ADD COLUMN kyc_media_filename TEXT" },
  {
    table: "users",
    column: "kyc_media_content_type",
    ddl: "ALTER TABLE users ADD COLUMN kyc_media_content_type TEXT",
  },
  {
    table: "users",
    column: "kyc_id_media_filename",
    ddl: "ALTER TABLE users ADD COLUMN kyc_id_media_filename TEXT",
  },
  {
    table: "users",
    column: "kyc_id_media_content_type",
    ddl: "ALTER TABLE users ADD COLUMN kyc_id_media_content_type TEXT",
  },
  {
    table: "users",
    column: "kyc_contract_media_filename",
    ddl: "ALTER TABLE users ADD COLUMN kyc_contract_media_filename TEXT",
  },
  {
    table: "users",
    column: "kyc_contract_media_content_type",
    ddl: "ALTER TABLE users ADD COLUMN kyc_contract_media_content_type TEXT",
  },
];

function columnExists(table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return rows.some((row) => row.name === column);
}

function applyIncrementalMigrations(): void {
  for (const { table, column, ddl } of ADDED_COLUMNS) {
    if (!columnExists(table, column)) {
      db.exec(ddl);
    }
  }
}

export function migrate(): void {
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  db.exec(schema);
  applyIncrementalMigrations();
}
