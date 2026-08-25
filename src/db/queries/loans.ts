import { db } from "../connection.js";

export type LoanStatus = "requested" | "active" | "repaid" | "late" | "cancelled";

export interface Loan {
  id: number;
  borrower_id: number;
  amount: number;
  tenor_days: number;
  status: LoanStatus;
  requested_at: string;
  funded_at: string | null;
  due_at: string | null;
  repaid_at: string | null;
  /** @deprecated remplace par interest_amount (nouveau modele d'interet du cahier des charges) */
  origination_fee: number | null;
  interest_amount: number | null;
  late_fee_applied: number | null;
  reminder_sent_at: string | null;
}

export function createLoan(params: {
  borrowerId: number;
  amount: number;
  tenorDays: number;
  interestAmount: number;
}): Loan {
  const info = db
    .prepare(
      `INSERT INTO loans (borrower_id, amount, tenor_days, interest_amount)
       VALUES (?, ?, ?, ?)`
    )
    .run(params.borrowerId, params.amount, params.tenorDays, params.interestAmount);
  return getLoanById(info.lastInsertRowid as number)!;
}

export function getLoanById(id: number): Loan | undefined {
  return db.prepare("SELECT * FROM loans WHERE id = ?").get(id) as Loan | undefined;
}

export function listOpenLoanRequests(): Loan[] {
  return db
    .prepare("SELECT * FROM loans WHERE status = 'requested' ORDER BY requested_at ASC")
    .all() as Loan[];
}

export function listLoansForBorrower(borrowerId: number): Loan[] {
  return db
    .prepare("SELECT * FROM loans WHERE borrower_id = ? ORDER BY requested_at DESC")
    .all(borrowerId) as Loan[];
}

export function listAllLoans(): Loan[] {
  return db.prepare("SELECT * FROM loans ORDER BY requested_at DESC").all() as Loan[];
}

export function listActiveLoansPastDue(): Loan[] {
  return db
    .prepare("SELECT * FROM loans WHERE status = 'active' AND due_at < datetime('now')")
    .all() as Loan[];
}

export function listActiveLoansDueSoon(daysBefore: number): Loan[] {
  return db
    .prepare(
      `SELECT * FROM loans
       WHERE status = 'active'
         AND reminder_sent_at IS NULL
         AND due_at IS NOT NULL
         AND due_at BETWEEN datetime('now') AND datetime('now', '+' || ? || ' days')`
    )
    .all(daysBefore) as Loan[];
}

export function markReminderSent(loanId: number): void {
  db.prepare(`UPDATE loans SET reminder_sent_at = datetime('now') WHERE id = ?`).run(loanId);
}

export function activateLoan(loanId: number, dueAt: string): void {
  db.prepare(
    `UPDATE loans SET status = 'active', funded_at = datetime('now'), due_at = ? WHERE id = ?`
  ).run(dueAt, loanId);
}

export function markLoanRepaid(loanId: number): void {
  db.prepare(
    `UPDATE loans SET status = 'repaid', repaid_at = datetime('now') WHERE id = ?`
  ).run(loanId);
}

export function markLoanLate(loanId: number, lateFee: number): void {
  db.prepare(`UPDATE loans SET status = 'late', late_fee_applied = ? WHERE id = ?`).run(
    lateFee,
    loanId
  );
}

export function backdateLoanDueDate(loanId: number, dueAt: string): void {
  db.prepare(`UPDATE loans SET due_at = ? WHERE id = ?`).run(dueAt, loanId);
}
