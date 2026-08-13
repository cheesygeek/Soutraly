import { Router } from "express";
import twilio from "twilio";
import { dispatch } from "../bot/stateMachine.js";
import { stripWhatsAppPrefix } from "../whatsapp/normalizePhone.js";
import { TWILIO_AUTH_TOKEN, PUBLIC_BASE_URL } from "../config/whatsapp.js";

export const whatsappRouter = Router();

whatsappRouter.post("/", (req, res) => {
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

  const reply = dispatch(phone, body);

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message(reply.lines.join("\n"));

  res.type("text/xml").send(twiml.toString());
});
