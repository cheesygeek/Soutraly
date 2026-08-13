// Endpoints reserves aux tests manuels du prototype (pas d'auth, pas destines a la prod).
// Ils permettent de declencher le controle des retards et d'antidater une echeance
// sans devoir attendre 30 jours reels.

import { Router } from "express";
import { runLateLoanCheck } from "../services/lateLoanService.js";
import { backdateLoanDueDate, getLoanById } from "../db/queries/loans.js";

export const devRouter = Router();

devRouter.post("/run-late-check", (_req, res) => {
  const result = runLateLoanCheck();
  res.json(result);
});

devRouter.post("/loans/:id/backdate", (req, res) => {
  const loanId = parseInt(req.params.id, 10);
  const loan = getLoanById(loanId);
  if (!loan) {
    res.status(404).json({ error: "Pret introuvable." });
    return;
  }
  const daysAgo = typeof req.body?.daysAgo === "number" ? req.body.daysAgo : 1;
  const dueAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
  backdateLoanDueDate(loanId, dueAt);
  res.json({ ok: true, loanId, dueAt });
});
