const WHATSAPP_PREFIX = "whatsapp:";

export function stripWhatsAppPrefix(from: string): string {
  return from.startsWith(WHATSAPP_PREFIX) ? from.slice(WHATSAPP_PREFIX.length) : from;
}
