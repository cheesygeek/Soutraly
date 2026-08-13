export type ConversationState =
  | "WELCOME"
  | "ROLE_SELECT"
  | "REGISTER_NAME"
  | "REGISTER_KYC_PROOF"
  | "MAIN_MENU_BORROWER"
  | "REQUEST_LOAN_AMOUNT"
  | "CONFIRM_LOAN_REQUEST"
  | "REPAY_CONFIRM"
  | "MAIN_MENU_LENDER"
  | "BROWSE_LOANS"
  | "CONFIRM_FUND";

export interface SessionContext {
  role?: "borrower" | "lender";
  name?: string;
  pendingAmount?: number;
  selectedLoanId?: number;
  browseLoanIds?: number[];
}

export interface BotReply {
  lines: string[];
  quickReplies?: string[];
}

export interface HandlerArgs {
  phone: string;
  input: string;
  context: SessionContext;
  userId: number | null;
}

export type HandleOutcome =
  | {
      ok: true;
      nextState: ConversationState;
      contextPatch?: Partial<SessionContext>;
      userId?: number;
      extraLines?: string[];
    }
  | { ok: false; error?: string };

export interface StateModule {
  prompt(context: SessionContext, userId: number | null): BotReply;
  handle(args: HandlerArgs): HandleOutcome;
}
