import type { StateModule } from "../types.js";
import { getBorrowerLoans, findRepayableLoan, isBorrowingWindowOpen } from "../../services/loanService.js";
import { BORROWING_WINDOW_OPEN_DAY, BORROWING_WINDOW_CLOSE_DAY } from "../../config/loanRules.js";
import { formatLoanLine } from "../formatters.js";

export const mainMenuBorrower: StateModule = {
  prompt() {
    return {
      lines: [
        "Menu emprunteur — que souhaitez-vous faire ?",
        "1. Demander un pret",
        "2. Voir le statut de mes prets",
        "3. Rembourser mon pret",
        "0. Quitter",
      ],
      quickReplies: ["1", "2", "3", "0"],
    };
  },
  handle({ input, userId }) {
    const choice = input.trim();

    if (choice === "1") {
      if (!isBorrowingWindowOpen()) {
        return {
          ok: true,
          nextState: "MAIN_MENU_BORROWER",
          extraLines: [
            `Les demandes de pret ne sont ouvertes que du ${BORROWING_WINDOW_OPEN_DAY} a la fin du mois, jusqu'au ${BORROWING_WINDOW_CLOSE_DAY} du mois suivant. Revenez pendant cette fenetre.`,
          ],
        };
      }
      return { ok: true, nextState: "REQUEST_LOAN_AMOUNT" };
    }

    if (choice === "2") {
      const loans = getBorrowerLoans(userId!);
      const lines =
        loans.length === 0
          ? ["Vous n'avez encore aucun pret."]
          : ["Vos prets :", ...loans.map(formatLoanLine)];
      return { ok: true, nextState: "MAIN_MENU_BORROWER", extraLines: lines };
    }

    if (choice === "3") {
      const loan = findRepayableLoan(userId!);
      if (!loan) {
        return {
          ok: true,
          nextState: "MAIN_MENU_BORROWER",
          extraLines: ["Vous n'avez aucun pret actif a rembourser."],
        };
      }
      return {
        ok: true,
        nextState: "REPAY_CONFIRM",
        contextPatch: { selectedLoanId: loan.id },
      };
    }

    if (choice === "0") {
      return {
        ok: true,
        nextState: "MAIN_MENU_BORROWER",
        extraLines: ["A bientot sur Soutraly !"],
      };
    }

    return { ok: false };
  },
};
