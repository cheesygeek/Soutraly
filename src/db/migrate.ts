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
  {
    table: "loans",
    column: "interest_amount",
    ddl: "ALTER TABLE loans ADD COLUMN interest_amount INTEGER",
  },
  {
    table: "loans",
    column: "reminder_sent_at",
    ddl: "ALTER TABLE loans ADD COLUMN reminder_sent_at TEXT",
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

// SQLite ne permet pas de modifier un CHECK existant via ALTER TABLE : il
// faut reconstruire la table (motif standard SQLite) pour elargir la liste
// des entry_type autorises (ajout de platform_revenue / reserve_fund pour
// le nouveau modele d'interet). Idempotent : ne s'execute que si le CHECK
// actuel ne contient pas encore ces valeurs.
function widenLedgerEntryTypeCheck(): void {
  const row = db
    .prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'ledger_entries'`)
    .get() as { sql: string } | undefined;

  if (!row || row.sql.includes("reserve_fund")) return;

  db.exec(`
    ALTER TABLE ledger_entries RENAME TO ledger_entries_old;
    CREATE TABLE ledger_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL REFERENCES loans(id),
      entry_type TEXT NOT NULL CHECK(entry_type IN
        ('origination_fee','service_fee','late_fee','principal_repayment','interest_spread','lender_payout',
         'platform_revenue','reserve_fund')),
      amount INTEGER NOT NULL,
      party TEXT NOT NULL CHECK(party IN ('platform','borrower','lender')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      note TEXT
    );
    INSERT INTO ledger_entries SELECT * FROM ledger_entries_old;
    DROP TABLE ledger_entries_old;
    CREATE INDEX IF NOT EXISTS idx_ledger_loan ON ledger_entries(loan_id);
  `);
}

export function migrate(): void {
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  db.exec(schema);
  applyIncrementalMigrations();
  widenLedgerEntryTypeCheck();
}
