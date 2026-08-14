import type { StateModule } from "../types.js";
import { createUser } from "../../db/queries/users.js";

export const registerKycId: StateModule = {
  prompt() {
    return {
      lines: ["Pour verifier votre identite, merci d'envoyer une photo ou un PDF d'une piece d'identite."],
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

    if (context.role === "lender") {
      const user = createUser({
        phone,
        name: context.name,
        role: context.role,
        kycIdMediaFilename: media.filename,
        kycIdMediaContentType: media.contentType,
      });
      return {
        ok: true,
        nextState: "MAIN_MENU_LENDER",
        userId: user.id,
        extraLines: [`Merci ${context.name}, votre profil est verifie. ✅`],
      };
    }

    // Emprunteur : on garde la piece d'identite de cote et on demande le contrat de travail.
    return {
      ok: true,
      nextState: "REGISTER_KYC_CONTRACT",
      contextPatch: { kycIdMediaFilename: media.filename, kycIdMediaContentType: media.contentType },
    };
  },
};
