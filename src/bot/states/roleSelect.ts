import type { StateModule } from "../types.js";

export const roleSelect: StateModule = {
  prompt() {
    return {
      lines: [
        "Bienvenue sur Soutraly !",
        "La plateforme qui connecte emprunteurs et preteurs pour des prets de 30 jours.",
        "",
        "Que souhaitez-vous faire ?",
        "1. Emprunter de l'argent",
        "2. Preter de l'argent",
      ],
      quickReplies: ["1", "2"],
    };
  },
  handle({ input }) {
    const choice = input.trim();
    if (choice === "1") {
      return { ok: true, nextState: "REGISTER_NAME", contextPatch: { role: "borrower" } };
    }
    if (choice === "2") {
      return { ok: true, nextState: "REGISTER_NAME", contextPatch: { role: "lender" } };
    }
    return { ok: false };
  },
};
