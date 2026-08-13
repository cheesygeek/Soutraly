import type { StateModule } from "../types.js";

export const welcome: StateModule = {
  prompt() {
    return {
      lines: ["Demarrage de la conversation..."],
    };
  },
  handle() {
    return { ok: true, nextState: "ROLE_SELECT" };
  },
};
