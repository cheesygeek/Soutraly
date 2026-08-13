// Config pour le webhook Twilio WhatsApp Sandbox. TWILIO_AUTH_TOKEN sert
// uniquement a valider la signature des requetes entrantes (pas d'envoi
// sortant via l'API REST pour l'instant, donc pas besoin de l'Account SID).

export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN ?? "";

export const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL ??
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "");
