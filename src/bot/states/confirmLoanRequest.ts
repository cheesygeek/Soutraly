import type { StateModule } from "../types.js";
import { createLoanRequest, BorrowingWindowClosedError } from "../../services/loanService.js";
import { computeInterest } from "../../config/interestModel.js";
import { formatXOF } from "../formatters.js";

export const confirmLoanRequest: StateModule = {
  prompt(context) {
    const amount = context.pendingAmount ?? 0;
    const interest = computeInterest(amount);
    return {
      lines: [
        `Vous demandez un pret de ${formatXOF(amount)} sur 30 jours.`,
        `Interet estime (1,9 %) : ${formatXOF(interest)}.`,
        `Total a rembourser a l'echeance : ${formatXOF(amount + interest)}.`,
        "",
        "1. Confirmer",
        "2. Annuler",
      ],
      quickReplies: ["1", "2"],
    };
  },
  handle({ input, context, userId }) {
    const choice = input.trim();
    if (choice === "1") {
      const amount = context.pendingAmount ?? 0;
      try {
        const loan = createLoanRequest(userId!, amount);
        return {
          ok: true,
          nextState: "MAIN_MENU_BORROWER",
          contextPatch: { pendingAmount: undefined },
          extraLines: [
            `Votre demande de pret #${loan.id} de ${formatXOF(loan.amount)} a ete enregistree (statut : en attente de financement).`,
          ],
        };
      } catch (err) {
        if (err instanceof BorrowingWindowClosedError) {
          return {
            ok: true,
            nextState: "MAIN_MENU_BORROWER",
            contextPatch: { pendingAmount: undefined },
            extraLines: [err.message],
          };
        }
        throw err;
      }
    }
    if (choice === "2") {
      return {
        ok: true,
        nextState: "MAIN_MENU_BORROWER",
        contextPatch: { pendingAmount: undefined },
        extraLines: ["Demande annulee."],
      };
    }
    return { ok: false };
  },
};
