import { db } from "../connection.js";

export interface Funding {
  id: number;
  loan_id: number;
  lender_id: number;
  amount: number;
  funded_at: string;
}

export function createFunding(params: { loanId: number; lenderId: number; amount: number }): Funding {
  const info = db
    .prepare(`INSERT INTO fundings (loan_id, lender_id, amount) VALUES (?, ?, ?)`)
    .run(params.loanId, params.lenderId, params.amount);
  return db.prepare("SELECT * FROM fundings WHERE id = ?").get(info.lastInsertRowid) as Funding;
}

export function getFundingByLoanId(loanId: number): Funding | undefined {
  return db.prepare("SELECT * FROM fundings WHERE loan_id = ?").get(loanId) as Funding | undefined;
}

export function listFundingsForLender(lenderId: number): Funding[] {
  return db
    .prepare("SELECT * FROM fundings WHERE lender_id = ? ORDER BY funded_at DESC")
    .all(lenderId) as Funding[];
}
