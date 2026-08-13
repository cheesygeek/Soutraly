import type { StateModule } from "../types.js";
import { validateLoanAmount, LoanAmountOutOfBoundsError } from "../../services/loanService.js";
import { LOAN_MIN_AMOUNT, LOAN_MAX_AMOUNT } from "../../config/loanRules.js";
import { formatXOF } from "../formatters.js";

export const requestLoanAmount: StateModule = {
  prompt() {
    return {
      lines: [
        `Quel montant souhaitez-vous emprunter ? (entre ${formatXOF(LOAN_MIN_AMOUNT)} et ${formatXOF(
          LOAN_MAX_AMOUNT
        )}, remboursable en 30 jours)`,
      ],
    };
  },
  handle({ input }) {
    const digits = input.replace(/[^\d]/g, "");
    const amount = parseInt(digits, 10);
    if (!digits || Number.isNaN(amount)) {
      return { ok: false, error: "Merci d'indiquer un montant en chiffres." };
    }
    try {
      validateLoanAmount(amount);
    } catch (err) {
      if (err instanceof LoanAmountOutOfBoundsError) {
        return { ok: false, error: err.message };
      }
      throw err;
    }
    return { ok: true, nextState: "CONFIRM_LOAN_REQUEST", contextPatch: { pendingAmount: amount } };
  },
};
