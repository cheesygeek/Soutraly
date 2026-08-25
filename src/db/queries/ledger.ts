import { db } from "../connection.js";

export type LedgerEntryType =
  | "origination_fee"
  | "service_fee"
  | "late_fee"
  | "principal_repayment"
  | "interest_spread"
  | "lender_payout"
  | "platform_revenue"
  | "reserve_fund";

export type LedgerParty = "platform" | "borrower" | "lender";

export interface LedgerEntry {
  id: number;
  loan_id: number;
  entry_type: LedgerEntryType;
  amount: number;
  party: LedgerParty;
  created_at: string;
  note: string | null;
}

export function addLedgerEntry(params: {
  loanId: number;
  entryType: LedgerEntryType;
  amount: number;
  party: LedgerParty;
  note?: string;
}): LedgerEntry {
  const info = db
    .prepare(
      `INSERT INTO ledger_entries (loan_id, entry_type, amount, party, note) VALUES (?, ?, ?, ?, ?)`
    )
    .run(params.loanId, params.entryType, params.amount, params.party, params.note ?? null);
  return db.prepare("SELECT * FROM ledger_entries WHERE id = ?").get(info.lastInsertRowid) as LedgerEntry;
}

export function listLedgerForLoan(loanId: number): LedgerEntry[] {
  return db
    .prepare("SELECT * FROM ledger_entries WHERE loan_id = ? ORDER BY created_at ASC")
    .all(loanId) as LedgerEntry[];
}

export function sumFeesCollected(): number {
  const row = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM ledger_entries
       WHERE entry_type IN ('origination_fee','service_fee','late_fee')`
    )
    .get() as { total: number };
  return row.total;
}

export function sumPlatformRevenue(): number {
  const row = db
    .prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM ledger_entries WHERE entry_type = 'platform_revenue'`)
    .get() as { total: number };
  return row.total;
}

export function sumReserveFund(): number {
  const row = db
    .prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM ledger_entries WHERE entry_type = 'reserve_fund'`)
    .get() as { total: number };
  return row.total;
}
