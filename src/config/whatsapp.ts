// Config pour le webhook Twilio WhatsApp Sandbox. TWILIO_AUTH_TOKEN sert a
// valider la signature des requetes entrantes ET (avec TWILIO_ACCOUNT_SID) a
// s'authentifier aupres de l'API media de Twilio pour telecharger les photos/PDF
// envoyes par les utilisateurs (l'URL Twilio n'est pas accessible anonymement).

export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";
export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? "";

// Numero WhatsApp depuis lequel les messages sortants (rappels) sont envoyes.
// Format E.164 sans le prefixe "whatsapp:" (ex: +14155238886 pour le sandbox).
export const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM ?? "";

export const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL ??
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "");
