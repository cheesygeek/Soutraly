import { listActiveLoansPastDue, markLoanLate } from "../db/queries/loans.js";
import { addLedgerEntry } from "../db/queries/ledger.js";
import { computeLateFee } from "./ledgerService.js";

export function runLateLoanCheck(): { markedLate: number[] } {
  const overdue = listActiveLoansPastDue();
  const markedLate: number[] = [];

  for (const loan of overdue) {
    const lateFee = computeLateFee();
    markLoanLate(loan.id, lateFee);
    addLedgerEntry({
      loanId: loan.id,
      entryType: "late_fee",
      amount: lateFee,
      party: "borrower",
      note: "Penalite de retard appliquee apres echeance",
    });
    markedLate.push(loan.id);
  }

  return { markedLate };
}
