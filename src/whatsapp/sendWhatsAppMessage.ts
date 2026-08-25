import twilio from "twilio";
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } from "../config/whatsapp.js";

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!client) {
    client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return client;
}

// Envoi sortant (proactif) - distinct de la reponse TwiML synchrone du
// webhook. Necessite TWILIO_WHATSAPP_FROM configure. A savoir : WhatsApp
// n'autorise le texte libre que dans la fenetre de 24h suivant le dernier
// message de l'utilisateur - passe ce delai, Meta peut rejeter l'envoi tant
// qu'aucun message-modele approuve n'est utilise. A verifier en conditions
// reelles avant de compter dessus pour tous les cas.
export async function sendWhatsAppMessage(toPhone: string, body: string): Promise<void> {
  if (!TWILIO_WHATSAPP_FROM) {
    throw new Error("TWILIO_WHATSAPP_FROM n'est pas configure.");
  }
  await getClient().messages.create({
    from: `whatsapp:${TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${toPhone}`,
    body,
  });
}
