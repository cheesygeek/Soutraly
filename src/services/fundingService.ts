import { activateLoan, getLoanById, type Loan } from "../db/queries/loans.js";
import { createFunding } from "../db/queries/fundings.js";
import { addLedgerEntry } from "../db/queries/ledger.js";
import { LOAN_TENOR_DAYS } from "../config/loanRules.js";
import { computeServiceFee } from "./ledgerService.js";

export class LoanNotFundableError extends Error {}

export function fundLoan(loanId: number, lenderId: number): Loan {
  const loan = getLoanById(loanId);
  if (!loan || loan.status !== "requested") {
    throw new LoanNotFundableError("Cette demande de pret n'est plus disponible.");
  }

  createFunding({ loanId, lenderId, amount: loan.amount });

  const dueAt = new Date(Date.now() + LOAN_TENOR_DAYS * 24 * 60 * 60 * 1000).toISOString();
  activateLoan(loanId, dueAt);

  const serviceFee = computeServiceFee(loan.amount);
  addLedgerEntry({
    loanId,
    entryType: "origination_fee",
    amount: loan.origination_fee ?? 0,
    party: "borrower",
    note: "Frais preleves a la mise en relation",
  });
  addLedgerEntry({
    loanId,
    entryType: "service_fee",
    amount: serviceFee,
    party: "lender",
    note: "Frais de service preleves au preteur",
  });

  return getLoanById(loanId)!;
}
