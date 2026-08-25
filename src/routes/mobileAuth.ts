import { Router } from "express";
import twilio from "twilio";
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } from "../config/whatsapp.js";
import { TWILIO_VERIFY_SERVICE_SID } from "../config/twilioVerify.js";
import { getUserByPhone } from "../db/queries/users.js";
import { createAuthToken } from "../db/queries/authTokens.js";

export const mobileAuthRouter = Router();

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

mobileAuthRouter.post("/request-otp", async (req, res) => {
  const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
  if (!phone) {
    res.status(400).json({ error: "Numero de telephone requis." });
    return;
  }

  try {
    await client.verify.v2.services(TWILIO_VERIFY_SERVICE_SID).verifications.create({
      to: phone,
      channel: "sms",
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: "Echec de l'envoi du code. Reessayez.", detail: (err as Error).message });
  }
});

mobileAuthRouter.post("/verify-otp", async (req, res) => {
  const phone = typeof req.body?.phone === "string" ? req.body.phone.trim() : "";
  const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
  if (!phone || !code) {
    res.status(400).json({ error: "Telephone et code requis." });
    return;
  }

  let approved: boolean;
  try {
    const check = await client.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to: phone, code });
    approved = check.status === "approved";
  } catch (err) {
    res.status(502).json({ error: "Echec de la verification du code.", detail: (err as Error).message });
    return;
  }

  if (!approved) {
    res.status(401).json({ error: "Code invalide ou expire." });
    return;
  }

  const existingUser = getUserByPhone(phone);
  const authToken = createAuthToken(phone, existingUser?.id ?? null);

  res.json({
    token: authToken.token,
    isRegistered: Boolean(existingUser),
    user: existingUser ?? null,
  });
});
