import { createLoan, listLoansForBorrower, type Loan } from "../db/queries/loans.js";
import {
  LOAN_MIN_AMOUNT,
  LOAN_MAX_AMOUNT,
  LOAN_TENOR_DAYS,
  BORROWING_WINDOW_OPEN_DAY,
  BORROWING_WINDOW_CLOSE_DAY,
} from "../config/loanRules.js";
import { computeInterest } from "../config/interestModel.js";

export class LoanAmountOutOfBoundsError extends Error {}
export class BorrowingWindowClosedError extends Error {}

export function validateLoanAmount(amount: number): void {
  if (!Number.isInteger(amount) || amount < LOAN_MIN_AMOUNT || amount > LOAN_MAX_AMOUNT) {
    throw new LoanAmountOutOfBoundsError(
      `Le montant doit etre un entier entre ${LOAN_MIN_AMOUNT} et ${LOAN_MAX_AMOUNT} XOF.`
    );
  }
}

// Fenetre calee sur la fin de mois (cahier des charges, section 4) : ouverte
// du BORROWING_WINDOW_OPEN_DAY jusqu'a la fin du mois, puis du 1er jusqu'au
// BORROWING_WINDOW_CLOSE_DAY inclus du mois suivant.
export function isBorrowingWindowOpen(now: Date = new Date()): boolean {
  const day = now.getDate();
  return day >= BORROWING_WINDOW_OPEN_DAY || day <= BORROWING_WINDOW_CLOSE_DAY;
}

export function validateBorrowingWindow(now: Date = new Date()): void {
  if (!isBorrowingWindowOpen(now)) {
    throw new BorrowingWindowClosedError(
      `Les demandes de pret ne sont ouvertes que du ${BORROWING_WINDOW_OPEN_DAY} a la fin du mois, jusqu'au ${BORROWING_WINDOW_CLOSE_DAY} du mois suivant.`
    );
  }
}

export function createLoanRequest(borrowerId: number, amount: number, now: Date = new Date()): Loan {
  validateBorrowingWindow(now);
  validateLoanAmount(amount);
  const interestAmount = computeInterest(amount);
  return createLoan({
    borrowerId,
    amount,
    tenorDays: LOAN_TENOR_DAYS,
    interestAmount,
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
