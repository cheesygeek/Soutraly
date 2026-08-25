import { listActiveLoansDueSoon, markReminderSent } from "../db/queries/loans.js";
import { getUserById } from "../db/queries/users.js";
import { sendWhatsAppMessage } from "../whatsapp/sendWhatsAppMessage.js";
import { getAmountDue } from "./repaymentService.js";
import { formatXOF } from "../bot/formatters.js";
import { REMINDER_DAYS_BEFORE_DUE } from "../config/loanRules.js";

export async function runLoanReminderCheck(): Promise<{ remindersSent: number[]; failed: number[] }> {
  const dueSoon = listActiveLoansDueSoon(REMINDER_DAYS_BEFORE_DUE);
  const remindersSent: number[] = [];
  const failed: number[] = [];

  for (const loan of dueSoon) {
    const borrower = getUserById(loan.borrower_id);
    if (!borrower) continue;

    const amountDue = getAmountDue(loan);
    const dueDate = loan.due_at ? loan.due_at.slice(0, 10) : "bientot";
    const body =
      `Bonjour ${borrower.name ?? ""}, votre pret Soutraly #${loan.id} arrive a echeance le ${dueDate}. ` +
      `Montant a rembourser : ${formatXOF(amountDue)}. Repondez a ce message sur WhatsApp pour le rembourser.`;

    try {
      await sendWhatsAppMessage(borrower.phone_number, body);
      markReminderSent(loan.id);
      remindersSent.push(loan.id);
    } catch (err) {
      console.error(`Echec de l'envoi du rappel pour le pret #${loan.id} :`, err);
      failed.push(loan.id);
    }
  }

  return { remindersSent, failed };
}
