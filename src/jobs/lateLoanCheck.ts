import { runLateLoanCheck } from "../services/lateLoanService.js";

const CHECK_INTERVAL_MS = 60_000;

export function startLateLoanCheckJob(): NodeJS.Timeout {
  return setInterval(() => {
    runLateLoanCheck();
  }, CHECK_INTERVAL_MS);
}
