// Miroir des formes retournees par l'API mobile (src/routes/mobileApi.ts cote serveur).

export interface User {
  id: number;
  phone_number: string;
  name: string | null;
  role: "borrower" | "lender" | null;
  kyc_status: string;
  created_at: string;
}

export type LoanStatus = "requested" | "active" | "repaid" | "late" | "cancelled";

export interface Loan {
  id: number;
  borrower_id: number;
  amount: number;
  tenor_days: number;
  status: LoanStatus;
  requested_at: string;
  funded_at: string | null;
  due_at: string | null;
  repaid_at: string | null;
  interest_amount: number | null;
  late_fee_applied: number | null;
  amount_due?: number;
}

export interface LoanWindowStatus {
  open: boolean;
  openDay: number;
  closeDay: number;
}

export interface VerifyOtpResponse {
  token: string;
  isRegistered: boolean;
  user: User | null;
}
