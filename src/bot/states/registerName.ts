import type { StateModule } from "../types.js";

export const registerName: StateModule = {
  prompt(context) {
    const roleLabel = context.role === "borrower" ? "emprunteur" : "preteur";
    return {
      lines: [`Vous vous inscrivez comme ${roleLabel}.`, "Quel est votre nom complet ?"],
    };
  },
  handle({ input }) {
    const name = input.trim();
    if (!name) {
      return { ok: false, error: "Merci d'indiquer votre nom complet." };
    }
    return { ok: true, nextState: "REGISTER_KYC_ID", contextPatch: { name } };
  },
};
