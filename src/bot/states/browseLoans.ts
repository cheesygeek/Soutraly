import type { StateModule } from "../types.js";
import { getLoanById } from "../../db/queries/loans.js";
import { formatXOF } from "../formatters.js";

export const browseLoans: StateModule = {
  prompt(context) {
    const ids = context.browseLoanIds ?? [];
    const loans = ids.map((id) => getLoanById(id)).filter((l): l is NonNullable<typeof l> => Boolean(l));

    if (loans.length === 0) {
      return { lines: ["Aucune demande de pret disponible pour le moment.", "", "0. Retour"], quickReplies: ["0"] };
    }

    const lines = [
      "Demandes de pret ouvertes :",
      ...loans.map((l, i) => `${i + 1}. ${formatXOF(l.amount)} sur 30 jours`),
      "",
      "0. Retour",
    ];
    return { lines, quickReplies: [...loans.map((_, i) => String(i + 1)), "0"] };
  },
  handle({ input, context }) {
    const choice = input.trim();
    if (choice === "0") {
      return { ok: true, nextState: "MAIN_MENU_LENDER" };
    }
    const index = parseInt(choice, 10);
    const ids = context.browseLoanIds ?? [];
    if (!Number.isInteger(index) || index < 1 || index > ids.length) {
      return { ok: false };
    }
    return {
      ok: true,
      nextState: "CONFIRM_FUND",
      contextPatch: { selectedLoanId: ids[index - 1] },
    };
  },
};
