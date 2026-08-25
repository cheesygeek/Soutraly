import { activateLoan, getLoanById, type Loan } from "../db/queries/loans.js";
import { createFunding } from "../db/queries/fundings.js";
import { LOAN_TENOR_DAYS } from "../config/loanRules.js";

export class LoanNotFundableError extends Error {}

// Le financement active le pret mais ne comptabilise plus rien au grand
// livre : l'interet n'est reparti (preteur/plateforme/reserve) qu'au
// remboursement, sur l'interet reellement percu (cf. repaymentService).
export function fundLoan(loanId: number, lenderId: number): Loan {
  const loan = getLoanById(loanId);
  if (!loan || loan.status !== "requested") {
    throw new LoanNotFundableError("Cette demande de pret n'est plus disponible.");
  }

  createFunding({ loanId, lenderId, amount: loan.amount });

  const dueAt = new Date(Date.now() + LOAN_TENOR_DAYS * 24 * 60 * 60 * 1000).toISOString();
  activateLoan(loanId, dueAt);

  return getLoanById(loanId)!;
}
