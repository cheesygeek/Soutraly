import { Router } from "express";
import { listUsers } from "../db/queries/users.js";
import { listAllLoans, getLoanById } from "../db/queries/loans.js";
import { getFundingByLoanId } from "../db/queries/fundings.js";
import { sumFeesCollected } from "../db/queries/ledger.js";

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
