import type { StateModule } from "../types.js";
import { createLoanRequest } from "../../services/loanService.js";
import { computeOriginationFee } from "../../services/ledgerService.js";
import { formatXOF } from "../formatters.js";

export const confirmLoanRequest: StateModule = {
  prompt(context) {
    const amount = context.pendingAmount ?? 0;
    const fee = computeOriginationFee(amount);
    return {
      lines: [
        `Vous demandez un pret de ${formatXOF(amount)} sur 30 jours.`,
        `Frais d'origination estimes : ${formatXOF(fee)} (a votre charge).`,
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
      const loan = createLoanRequest(userId!, amount);
      return {
        ok: true,
        nextState: "MAIN_MENU_BORROWER",
        contextPatch: { pendingAmount: undefined },
        extraLines: [
          `Votre demande de pret #${loan.id} de ${formatXOF(loan.amount)} a ete enregistree (statut : en attente de financement).`,
        ],
      };
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
