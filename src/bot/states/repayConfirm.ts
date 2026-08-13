import type { StateModule } from "../types.js";
import { getLoanById } from "../../db/queries/loans.js";
import { repayLoan, getAmountDue } from "../../services/repaymentService.js";
import { formatXOF } from "../formatters.js";

export const repayConfirm: StateModule = {
  prompt(context) {
    const loan = context.selectedLoanId ? getLoanById(context.selectedLoanId) : undefined;
    if (!loan) {
      return { lines: ["Ce pret n'est plus disponible."] };
    }
    const due = getAmountDue(loan);
    const lateNote =
      loan.status === "late" && loan.late_fee_applied
        ? ` (dont ${formatXOF(loan.late_fee_applied)} de penalite de retard)`
        : "";
    return {
      lines: [
        `Montant a rembourser : ${formatXOF(due)}${lateNote}.`,
        "",
        "1. Confirmer le remboursement",
        "2. Annuler",
      ],
      quickReplies: ["1", "2"],
    };
  },
  handle({ input, context }) {
    const choice = input.trim();
    if (choice === "1") {
      const loan = repayLoan(context.selectedLoanId!);
      return {
        ok: true,
        nextState: "MAIN_MENU_BORROWER",
        contextPatch: { selectedLoanId: undefined },
        extraLines: [`Remboursement du pret #${loan.id} enregistre. Merci !`],
      };
    }
    if (choice === "2") {
      return {
        ok: true,
        nextState: "MAIN_MENU_BORROWER",
        contextPatch: { selectedLoanId: undefined },
        extraLines: ["Remboursement annule."],
      };
    }
    return { ok: false };
  },
};
