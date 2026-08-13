import type { StateModule } from "../types.js";
import { createUser } from "../../db/queries/users.js";

export const registerKycProof: StateModule = {
  prompt(context) {
    const isBorrower = context.role === "borrower";
    return {
      lines: [
        isBorrower
          ? "Pour verifier votre identite, merci d'envoyer une copie (texte) de votre contrat de travail."
          : "Pour verifier votre identite, merci d'envoyer une piece d'identite (texte).",
      ],
    };
  },
  handle({ input, context, phone }) {
    const proof = input.trim();
    if (!proof) {
      return { ok: false, error: "Merci d'envoyer un justificatif (texte)." };
    }
    if (!context.role || !context.name) {
      // Should not happen given the FSM order, but guards against a corrupted session.
      return { ok: true, nextState: "ROLE_SELECT" };
    }
    const user = createUser({
      phone,
      name: context.name,
      role: context.role,
      kycProofStub: proof,
    });
    const nextState = context.role === "borrower" ? "MAIN_MENU_BORROWER" : "MAIN_MENU_LENDER";
    return {
      ok: true,
      nextState,
      userId: user.id,
      extraLines: [`Merci ${context.name}, votre profil est verifie. ✅`],
    };
  },
};
