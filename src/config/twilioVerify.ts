// Service Twilio Verify utilise pour l'authentification par OTP SMS de
// l'app mobile. A creer dans la Console Twilio (Verify > Services) —
// independant du numero WhatsApp, aucun lien avec le blocage Meta en cours.

export const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID ?? "";
