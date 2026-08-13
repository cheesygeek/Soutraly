import type { StateModule } from "../types.js";
import { listOpenLoanRequests } from "../../db/queries/loans.js";
import { getLoanById } from "../../db/queries/loans.js";
import { listFundingsForLender } from "../../db/queries/fundings.js";
import { formatLoanLine } from "../formatters.js";

export const mainMenuLender: StateModule = {
  prompt() {
    return {
      lines: [
        "Menu preteur — que souhaitez-vous faire ?",
        "1. Parcourir les demandes de pret",
        "2. Voir mes prets finances",
        "0. Quitter",
      ],
      quickReplies: ["1", "2", "0"],
    };
  },
  handle({ input, userId }) {
    const choice = input.trim();

    if (choice === "1") {
      const openLoans = listOpenLoanRequests();
      return {
        ok: true,
        nextState: "BROWSE_LOANS",
        contextPatch: { browseLoanIds: openLoans.map((l) => l.id) },
      };
    }

    if (choice === "2") {
      const fundings = listFundingsForLender(userId!);
      const lines =
        fundings.length === 0
          ? ["Vous n'avez encore finance aucun pret."]
          : [
              "Vos prets finances :",
              ...fundings
                .map((f) => getLoanById(f.loan_id))
                .filter((l): l is NonNullable<typeof l> => Boolean(l))
                .map(formatLoanLine),
            ];
      return { ok: true, nextState: "MAIN_MENU_LENDER", extraLines: lines };
    }

    if (choice === "0") {
      return {
        ok: true,
        nextState: "MAIN_MENU_LENDER",
        extraLines: ["A bientot sur Soutraly !"],
      };
    }

    return { ok: false };
  },
};
