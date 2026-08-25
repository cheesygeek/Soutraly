import { runLoanReminderCheck } from "../services/loanReminderService.js";

// Un rappel n'est pas urgent a la minute pres - une verification horaire suffit.
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

export function startLoanReminderJob(): NodeJS.Timeout {
  return setInterval(() => {
    runLoanReminderCheck().catch((err) => console.error("Erreur job de rappel de pret :", err));
  }, CHECK_INTERVAL_MS);
}
