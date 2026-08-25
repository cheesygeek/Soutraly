import { Router } from "express";
import multer from "multer";
import { mobileAuth, requireRegisteredUser } from "../middleware/mobileAuth.js";
import { bindAuthTokenToUser } from "../db/queries/authTokens.js";
import { createUser, getUserByPhone, getUserById } from "../db/queries/users.js";
import { isAllowedContentType, saveMediaBuffer, MAX_MEDIA_BYTES } from "../whatsapp/mediaStorage.js";
import {
  createLoanRequest,
  getBorrowerLoans,
  isBorrowingWindowOpen,
  LoanAmountOutOfBoundsError,
  BorrowingWindowClosedError,
} from "../services/loanService.js";
import { BORROWING_WINDOW_OPEN_DAY, BORROWING_WINDOW_CLOSE_DAY } from "../config/loanRules.js";
import { repayLoan, getAmountDue, LoanNotRepayableError } from "../services/repaymentService.js";
import { getLoanById } from "../db/queries/loans.js";

export const mobileApiRouter = Router();
mobileApiRouter.use(mobileAuth);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_MEDIA_BYTES } });

function extractFile(
  files: Record<string, Express.Multer.File[]> | undefined,
  field: string
): Express.Multer.File | undefined {
  return files?.[field]?.[0];
}

mobileApiRouter.post(
  "/register",
  upload.fields([
    { name: "idDocument", maxCount: 1 },
    { name: "contractDocument", maxCount: 1 },
  ]),
  (req, res) => {
    const phone = req.mobileAuth!.phoneNumber;
    if (getUserByPhone(phone)) {
      res.status(409).json({ error: "Ce numero est deja inscrit." });
      return;
    }

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const idFile = extractFile(files, "idDocument");
    const contractFile = extractFile(files, "contractDocument");

    if (!name) {
      res.status(400).json({ error: "Le nom complet est requis." });
      return;
    }
    if (!idFile || !isAllowedContentType(idFile.mimetype)) {
      res.status(400).json({ error: "Piece d'identite manquante ou format non supporte (JPEG/PNG/PDF)." });
      return;
    }
    if (!contractFile || !isAllowedContentType(contractFile.mimetype)) {
      res.status(400).json({ error: "Contrat de travail manquant ou format non supporte (JPEG/PNG/PDF)." });
      return;
    }

    const idMedia = saveMediaBuffer(idFile.buffer, idFile.mimetype);
    const contractMedia = saveMediaBuffer(contractFile.buffer, contractFile.mimetype);

    const user = createUser({
      phone,
      name,
      role: "borrower",
      kycIdMediaFilename: idMedia.filename,
      kycIdMediaContentType: idMedia.contentType,
      kycContractMediaFilename: contractMedia.filename,
      kycContractMediaContentType: contractMedia.contentType,
    });

    bindAuthTokenToUser(req.header("Authorization")!.split(" ")[1], user.id);

    res.json({ user });
  }
);

mobileApiRouter.get("/loan-window", (_req, res) => {
  res.json({
    open: isBorrowingWindowOpen(),
    openDay: BORROWING_WINDOW_OPEN_DAY,
    closeDay: BORROWING_WINDOW_CLOSE_DAY,
  });
});

mobileApiRouter.get("/me", requireRegisteredUser, (req, res) => {
  const user = getUserById(req.mobileAuth!.userId!);
  res.json({ user });
});

mobileApiRouter.get("/loans", requireRegisteredUser, (req, res) => {
  const loans = getBorrowerLoans(req.mobileAuth!.userId!).map((loan) => ({
    ...loan,
    amount_due: getAmountDue(loan),
  }));
  res.json({ loans });
});

mobileApiRouter.post("/loans", requireRegisteredUser, (req, res) => {
  const amount = typeof req.body?.amount === "number" ? req.body.amount : NaN;
  try {
    const loan = createLoanRequest(req.mobileAuth!.userId!, amount);
    res.json({ loan });
  } catch (err) {
    if (err instanceof LoanAmountOutOfBoundsError || err instanceof BorrowingWindowClosedError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

mobileApiRouter.post("/loans/:id/repay", requireRegisteredUser, (req, res) => {
  const loanId = parseInt(req.params.id, 10);
  const loan = getLoanById(loanId);
  if (!loan || loan.borrower_id !== req.mobileAuth!.userId) {
    res.status(404).json({ error: "Pret introuvable." });
    return;
  }
  try {
    const repaid = repayLoan(loanId);
    res.json({ loan: repaid });
  } catch (err) {
    if (err instanceof LoanNotRepayableError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});
