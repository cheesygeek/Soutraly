CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT CHECK(role IN ('borrower','lender')),
  kyc_status TEXT NOT NULL DEFAULT 'pending' CHECK(kyc_status IN ('pending','submitted','verified','rejected')),
  kyc_proof_stub TEXT,
  kyc_media_filename TEXT,
  kyc_media_content_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bot_sessions (
  phone_number TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  state TEXT NOT NULL DEFAULT 'WELCOME',
  context_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  borrower_id INTEGER NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  tenor_days INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','active','repaid','late','cancelled')),
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  funded_at TEXT,
  due_at TEXT,
  repaid_at TEXT,
  origination_fee INTEGER,
  late_fee_applied INTEGER
);

CREATE TABLE IF NOT EXISTS fundings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER NOT NULL UNIQUE REFERENCES loans(id),
  lender_id INTEGER NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  funded_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER NOT NULL REFERENCES loans(id),
  entry_type TEXT NOT NULL CHECK(entry_type IN
    ('origination_fee','service_fee','late_fee','principal_repayment','interest_spread','lender_payout')),
  amount INTEGER NOT NULL,
  party TEXT NOT NULL CHECK(party IN ('platform','borrower','lender')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  note TEXT
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('inbound','outbound')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_borrower ON loans(borrower_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_phone ON chat_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_ledger_loan ON ledger_entries(loan_id);
