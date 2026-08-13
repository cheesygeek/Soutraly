import { createLoan, listLoansForBorrower, type Loan } from "../db/queries/loans.js";
import { LOAN_MIN_AMOUNT, LOAN_MAX_AMOUNT, LOAN_TENOR_DAYS } from "../config/loanRules.js";
import { computeOriginationFee } from "./ledgerService.js";

export class LoanAmountOutOfBoundsError extends Error {}

export function validateLoanAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount < LOAN_MIN_AMOUNT || amount > LOAN_MAX_AMOUNT) {
    throw new LoanAmountOutOfBoundsError(
      `Le montant doit etre un entier entre ${LOAN_MIN_AMOUNT} et ${LOAN_MAX_AMOUNT} XOF.`
    );
  }
}

export function createLoanRequest(borrowerId: number, amount: number): Loan {
  validateLoanAmount(amount);
  const originationFee = computeOriginationFee(amount);
  return createLoan({
    borrowerId,
    amount,
    tenorDays: LOAN_TENOR_DAYS,
    originationFee,
  });
}

export function getBorrowerLoans(borrowerId: number): Loan[] {
  return listLoansForBorrower(borrowerId);
}

export function findRepayableLoan(borrowerId: number): Loan | undefined {
  return listLoansForBorrower(borrowerId).find(
    (loan) => loan.status === "active" || loan.status === "late"
  );
}
