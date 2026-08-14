import type { StateModule } from "../types.js";
import { createUser } from "../../db/queries/users.js";

export const registerKycContract: StateModule = {
  prompt() {
    return {
      lines: ["Merci. Envoyez maintenant une photo ou un PDF de votre contrat de travail."],
    };
  },
  handle({ media, context, phone }) {
    if (!media) {
      return { ok: false, error: "Merci d'envoyer une photo ou un PDF (pas de texte)." };
    }
    if (media.kind === "rejected") {
      return { ok: false, error: media.reason };
    }
    if (!context.role || !context.name || !context.kycIdMediaFilename || !context.kycIdMediaContentType) {
      // Should not happen given the FSM order, but guards against a corrupted session.
      return { ok: true, nextState: "ROLE_SELECT" };
    }

    const user = createUser({
      phone,
      name: context.name,
      role: "borrower",
      kycIdMediaFilename: context.kycIdMediaFilename,
      kycIdMediaContentType: context.kycIdMediaContentType,
      kycContractMediaFilename: media.filename,
      kycContractMediaContentType: media.contentType,
    });
    return {
      ok: true,
      nextState: "MAIN_MENU_BORROWER",
      userId: user.id,
      extraLines: [`Merci ${context.name}, votre profil est verifie. ✅`],
    };
  },
};
