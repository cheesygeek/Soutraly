import { Router, type Response } from "express";
import { resolve } from "node:path";
import { listUsers, getUserById } from "../db/queries/users.js";
import { listAllLoans, getLoanById } from "../db/queries/loans.js";
import { getFundingByLoanId } from "../db/queries/fundings.js";
import { sumFeesCollected } from "../db/queries/ledger.js";
import { KYC_UPLOAD_DIR } from "../whatsapp/mediaStorage.js";

export const adminRouter = Router();

adminRouter.get("/overview", (_req, res) => {
  const users = listUsers();
  const usersById = new Map(users.map((u) => [u.id, u]));

  const loans = listAllLoans().map((loan) => {
    const borrower = usersById.get(loan.borrower_id);
    const funding = getFundingByLoanId(loan.id);
    const lender = funding ? usersById.get(funding.lender_id) : undefined;
    return {
      ...loan,
      borrower_name: borrower?.name ?? null,
      lender_name: lender?.name ?? null,
    };
  });

  const summary = {
    total_borrowers: users.filter((u) => u.role === "borrower").length,
    total_lenders: users.filter((u) => u.role === "lender").length,
    active_loans: loans.filter((l) => l.status === "active").length,
    late_loans: loans.filter((l) => l.status === "late").length,
    total_fees_collected: sumFeesCollected(),
  };

  res.json({ users, loans, summary });
});

// Le nom de fichier vient toujours de la base (genere par mediaStorage a la
// reception), jamais du client - pas de risque de traversee de repertoire.
function sendUserMedia(res: Response, filename: string | null) {
  if (!filename) {
    res.status(404).send("Aucun document disponible.");
    return;
  }
  res.sendFile(resolve(KYC_UPLOAD_DIR, filename));
}

// Ancien format (une seule piece justificative, avant la separation ID/contrat).
adminRouter.get("/kyc/:userId", (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const user = Number.isInteger(userId) ? getUserById(userId) : undefined;
  sendUserMedia(res, user?.kyc_media_filename ?? null);
});

adminRouter.get("/kyc/:userId/id", (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const user = Number.isInteger(userId) ? getUserById(userId) : undefined;
  sendUserMedia(res, user?.kyc_id_media_filename ?? null);
});

adminRouter.get("/kyc/:userId/contract", (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const user = Number.isInteger(userId) ? getUserById(userId) : undefined;
  sendUserMedia(res, user?.kyc_contract_media_filename ?? null);
});
