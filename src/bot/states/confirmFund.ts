import type { StateModule } from "../types.js";
import { getLoanById } from "../../db/queries/loans.js";
import { fundLoan, LoanNotFundableError } from "../../services/fundingService.js";
import { splitInterest } from "../../config/interestModel.js";
import { formatXOF } from "../formatters.js";

export const confirmFund: StateModule = {
  prompt(context) {
    const loan = context.selectedLoanId ? getLoanById(context.selectedLoanId) : undefined;
    if (!loan) {
      return { lines: ["Ce pret n'est plus disponible."] };
    }
    const { lenderShare } = splitInterest(loan.interest_amount ?? 0);
    return {
      lines: [
        `Vous allez financer un pret de ${formatXOF(loan.amount)} (echeance 30 jours).`,
        `Rendement estime a l'echeance : ${formatXOF(lenderShare)} (50 % de l'interet).`,
        "",
        "1. Confirmer le financement",
        "2. Annuler",
      ],
      quickReplies: ["1", "2"],
    };
  },
  handle({ input, context, userId }) {
    const choice = input.trim();
    if (choice === "1") {
      try {
        const loan = fundLoan(context.selectedLoanId!, userId!);
        return {
          ok: true,
          nextState: "MAIN_MENU_LENDER",
          contextPatch: { selectedLoanId: undefined, browseLoanIds: undefined },
          extraLines: [
            `Pret #${loan.id} finance avec succes ! Vous recevrez le remboursement a l'echeance.`,
          ],
        };
      } catch (err) {
        if (err instanceof LoanNotFundableError) {
          return {
            ok: true,
            nextState: "MAIN_MENU_LENDER",
            contextPatch: { selectedLoanId: undefined, browseLoanIds: undefined },
            extraLines: ["Ce pret n'est plus disponible (deja finance entre-temps)."],
          };
        }
        throw err;
      }
    }
    if (choice === "2") {
      return {
        ok: true,
        nextState: "BROWSE_LOANS",
        contextPatch: { selectedLoanId: undefined },
      };
    }
    return { ok: false };
  },
};
