import { getLoanById, markLoanRepaid, type Loan } from "../db/queries/loans.js";
import { getFundingByLoanId } from "../db/queries/fundings.js";
import { addLedgerEntry } from "../db/queries/ledger.js";

export class LoanNotRepayableError extends Error {}

export function getAmountDue(loan: Loan): number {
  return loan.amount + (loan.late_fee_applied ?? 0);
}

export function repayLoan(loanId: number): Loan {
  const loan = getLoanById(loanId);
  if (!loan || (loan.status !== "active" && loan.status !== "late")) {
    throw new LoanNotRepayableError("Ce pret n'est pas remboursable dans son etat actuel.");
  }
  const funding = getFundingByLoanId(loanId);
  if (!funding) {
    throw new LoanNotRepayableError("Aucun financement trouve pour ce pret.");
  }

  markLoanRepaid(loanId);

  addLedgerEntry({
    loanId,
    entryType: "principal_repayment",
    amount: loan.amount,
    party: "borrower",
    note: "Remboursement du principal par l'emprunteur",
  });
  addLedgerEntry({
    loanId,
    entryType: "lender_payout",
    amount: loan.amount,
    party: "lender",
    note: "Reversement du principal au preteur",
  });

  return getLoanById(loanId)!;
}
