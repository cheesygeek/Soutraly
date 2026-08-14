import { Router } from "express";
import twilio from "twilio";
import { dispatch } from "../bot/stateMachine.js";
import type { MediaInput } from "../bot/types.js";
import { stripWhatsAppPrefix } from "../whatsapp/normalizePhone.js";
import { TWILIO_AUTH_TOKEN, PUBLIC_BASE_URL } from "../config/whatsapp.js";
import {
  downloadTwilioMedia,
  isAllowedContentType,
  MediaFetchError,
  MediaTooLargeError,
} from "../whatsapp/mediaStorage.js";

export const whatsappRouter = Router();

async function resolveMedia(body: Record<string, unknown>): Promise<MediaInput | undefined> {
  const numMedia = parseInt(String(body.NumMedia ?? "0"), 10);
  if (!numMedia || numMedia < 1) return undefined;

  const mediaUrl = typeof body.MediaUrl0 === "string" ? body.MediaUrl0 : "";
  const contentType = typeof body.MediaContentType0 === "string" ? body.MediaContentType0 : "";

  if (!mediaUrl || !isAllowedContentType(contentType)) {
    return { kind: "rejected", reason: "Format non supporte. Envoyez une photo (JPEG/PNG) ou un PDF." };
  }

  try {
    const stored = await downloadTwilioMedia(mediaUrl, contentType);
    return { kind: "file", filename: stored.filename, contentType: stored.contentType };
  } catch (err) {
    const reason =
      err instanceof MediaTooLargeError
        ? err.message
        : err instanceof MediaFetchError
          ? "Impossible de recuperer le fichier envoye, merci de reessayer."
          : "Erreur inattendue lors de la reception du fichier.";
    return { kind: "rejected", reason };
  }
}

whatsappRouter.post("/", async (req, res) => {
  const signature = req.header("X-Twilio-Signature") ?? "";
  const url = `${PUBLIC_BASE_URL}${req.originalUrl}`;

  const isValid = twilio.validateRequest(TWILIO_AUTH_TOKEN, signature, url, req.body);
  if (!isValid) {
    res.status(403).send("Signature Twilio invalide.");
    return;
  }

  const from = typeof req.body?.From === "string" ? req.body.From : "";
  const body = typeof req.body?.Body === "string" ? req.body.Body : "";
  const phone = stripWhatsAppPrefix(from);

  const media = await resolveMedia(req.body);
  const reply = dispatch(phone, body, media);

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply.lines.join("\n"));

  res.type("text/xml").send(twiml.toString());
});
