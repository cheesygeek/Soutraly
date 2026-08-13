import type { Loan, LoanStatus } from "../db/queries/loans.js";

export function formatXOF(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} XOF`;
}

const STATUS_LABELS: Record<LoanStatus, string> = {
  requested: "en attente de financement",
  active: "actif",
  repaid: "rembourse",
  late: "en retard",
  cancelled: "annule",
};

export function statusLabel(status: LoanStatus): string {
  return STATUS_LABELS[status];
}

export function formatLoanLine(loan: Loan): string {
  const due = loan.due_at ? ` — echeance ${loan.due_at.slice(0, 10)}` : "";
  return `#${loan.id} · ${formatXOF(loan.amount)} · ${statusLabel(loan.status)}${due}`;
}
