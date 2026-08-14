import type { StateModule } from "../types.js";
import { createUser } from "../../db/queries/users.js";

export const registerKycProof: StateModule = {
  prompt(context) {
    const isBorrower = context.role === "borrower";
    return {
      lines: [
        isBorrower
          ? "Pour verifier votre identite, merci d'envoyer une photo ou un PDF de votre contrat de travail."
          : "Pour verifier votre identite, merci d'envoyer une photo ou un PDF d'une piece d'identite.",
      ],
    };
  },
  handle({ media, context, phone }) {
    if (!media) {
      return { ok: false, error: "Merci d'envoyer une photo ou un PDF (pas de texte)." };
    }
    if (media.kind === "rejected") {
      return { ok: false, error: media.reason };
    }
    if (!context.role || !context.name) {
      // Should not happen given the FSM order, but guards against a corrupted session.
      return { ok: true, nextState: "ROLE_SELECT" };
    }
    const user = createUser({
      phone,
      name: context.name,
      role: context.role,
      kycMediaFilename: media.filename,
      kycMediaContentType: media.contentType,
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
