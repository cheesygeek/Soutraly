import type { BotReply, ConversationState, MediaInput, SessionContext, StateModule } from "./types.js";
import { getOrCreateSession, saveSession } from "../db/queries/sessions.js";
import { logMessage, getHistory } from "../db/queries/messages.js";

import { welcome } from "./states/welcome.js";
import { roleSelect } from "./states/roleSelect.js";
import { registerName } from "./states/registerName.js";
import { registerKycProof } from "./states/registerKycProof.js";
import { mainMenuBorrower } from "./states/mainMenuBorrower.js";
import { requestLoanAmount } from "./states/requestLoanAmount.js";
import { confirmLoanRequest } from "./states/confirmLoanRequest.js";
import { repayConfirm } from "./states/repayConfirm.js";
import { mainMenuLender } from "./states/mainMenuLender.js";
import { browseLoans } from "./states/browseLoans.js";
import { confirmFund } from "./states/confirmFund.js";

const states: Record<ConversationState, StateModule> = {
  WELCOME: welcome,
  ROLE_SELECT: roleSelect,
  REGISTER_NAME: registerName,
  REGISTER_KYC_PROOF: registerKycProof,
  MAIN_MENU_BORROWER: mainMenuBorrower,
  REQUEST_LOAN_AMOUNT: requestLoanAmount,
  CONFIRM_LOAN_REQUEST: confirmLoanRequest,
  REPAY_CONFIRM: repayConfirm,
  MAIN_MENU_LENDER: mainMenuLender,
  BROWSE_LOANS: browseLoans,
  CONFIRM_FUND: confirmFund,
};

function parseContext(json: string): SessionContext {
  try {
    return JSON.parse(json) as SessionContext;
  } catch {
    return {};
  }
}

function describeMedia(media: MediaInput): string {
  if (media.kind === "rejected") return "[Fichier rejete]";
  if (media.contentType === "application/pdf") return "[PDF]";
  if (media.contentType.startsWith("image/")) return "[Photo]";
  return "[Fichier]";
}

/**
 * Dispatches one inbound message through the FSM. Invalid input never advances
 * the state — it re-shows the current state's prompt so the bot can't get stuck
 * or crash on unexpected text.
 */
export function dispatch(phone: string, input: string, media?: MediaInput): BotReply {
  const session = getOrCreateSession(phone);
  const currentState = session.state as ConversationState;
  const context = parseContext(session.context_json);
  const module = states[currentState];

  if (input !== "" || media) {
    logMessage(phone, "inbound", input !== "" ? input : describeMedia(media!));
  }

  const outcome = module.handle({ phone, input, context, userId: session.user_id, media });

  let reply: BotReply;
  let nextState: ConversationState;
  let nextContext: SessionContext;
  let nextUserId: number | null;

  if (outcome.ok) {
    nextState = outcome.nextState;
    nextContext = { ...context, ...outcome.contextPatch };
    nextUserId = outcome.userId ?? session.user_id;
    const nextPrompt = states[nextState].prompt(nextContext, nextUserId);
    reply = {
      lines: [...(outcome.extraLines ?? []), ...nextPrompt.lines],
      quickReplies: nextPrompt.quickReplies,
    };
  } else {
    nextState = currentState;
    nextContext = context;
    nextUserId = session.user_id;
    const currentPrompt = module.prompt(context, session.user_id);
    reply = {
      lines: [
        outcome.error ?? "Desole, je n'ai pas compris.",
        ...currentPrompt.lines,
      ],
      quickReplies: currentPrompt.quickReplies,
    };
  }

  saveSession(phone, nextState, nextContext, nextUserId);
  logMessage(phone, "outbound", reply.lines.join("\n"));

  return reply;
}

/**
 * Ensures a brand-new phone number gets its opening greeting logged before any
 * history is returned, so the chat UI has something to render on first load.
 */
export function ensureBootstrapped(phone: string): void {
  const history = getHistory(phone);
  if (history.length === 0) {
    dispatch(phone, "");
  }
}

export function getChatHistory(phone: string): {
  messages: ReturnType<typeof getHistory>;
  quickReplies: string[] | undefined;
} {
  ensureBootstrapped(phone);
  const session = getOrCreateSession(phone);
  const currentState = session.state as ConversationState;
  const context = parseContext(session.context_json);
  const quickReplies = states[currentState].prompt(context, session.user_id).quickReplies;
  return { messages: getHistory(phone), quickReplies };
}
