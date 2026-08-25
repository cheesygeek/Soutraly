import { getLoanById, markLoanRepaid, type Loan } from "../db/queries/loans.js";
import { getFundingByLoanId } from "../db/queries/fundings.js";
import { addLedgerEntry } from "../db/queries/ledger.js";
import { splitInterest } from "../config/interestModel.js";

export class LoanNotRepayableError extends Error {}

export function getAmountDue(loan: Loan): number {
  return loan.amount + (loan.interest_amount ?? 0) + (loan.late_fee_applied ?? 0);
}

// L'interet (1,9 % du principal) est reparti ici, a l'echeance effectivement
// percue - pas au financement - entre le preteur (50 %), la plateforme
// (30 %) et le fonds de reserve mutualise (20 %). Cf. cahier des charges,
// section 5.
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

  const interest = loan.interest_amount ?? 0;
  const { lenderShare, platformShare, reserveShare } = splitInterest(interest);

  addLedgerEntry({
    loanId,
    entryType: "principal_repayment",
    amount: loan.amount + interest,
    party: "borrower",
    note: "Remboursement du principal et de l'interet par l'emprunteur",
  });
  addLedgerEntry({
    loanId,
    entryType: "lender_payout",
    amount: loan.amount + lenderShare,
    party: "lender",
    note: "Reversement du principal + 50 % de l'interet au preteur",
  });
  addLedgerEntry({
    loanId,
    entryType: "platform_revenue",
    amount: platformShare,
    party: "platform",
    note: "Marge Soutraly (30 % de l'interet)",
  });
  addLedgerEntry({
    loanId,
    entryType: "reserve_fund",
    amount: reserveShare,
    party: "platform",
    note: "Provisionnement du fonds de reserve mutualise (20 % de l'interet)",
  });

  return getLoanById(loanId)!;
}
