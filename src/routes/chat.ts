import { Router } from "express";
import multer from "multer";
import { dispatch, getChatHistory } from "../bot/stateMachine.js";
import type { MediaInput } from "../bot/types.js";
import { isAllowedContentType, saveMediaBuffer, MAX_MEDIA_BYTES } from "../whatsapp/mediaStorage.js";

export const chatRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_MEDIA_BYTES } });

chatRouter.get("/:phone/history", (req, res) => {
  const phone = req.params.phone.trim();
  if (!phone) {
    res.status(400).json({ error: "Numero de telephone requis." });
    return;
  }
  const { messages, quickReplies } = getChatHistory(phone);
  res.json({ messages, quickReplies });
});

chatRouter.post("/:phone/message", (req, res) => {
  const phone = req.params.phone.trim();
  const input = typeof req.body?.text === "string" ? req.body.text : "";
  if (!phone) {
    res.status(400).json({ error: "Numero de telephone requis." });
    return;
  }
  const reply = dispatch(phone, input);
  res.json({ reply });
});

chatRouter.post("/:phone/upload", upload.single("file"), (req, res) => {
  const phone = req.params.phone.trim();
  if (!phone) {
    res.status(400).json({ error: "Numero de telephone requis." });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "Aucun fichier recu." });
    return;
  }

  let media: MediaInput;
  if (!isAllowedContentType(req.file.mimetype)) {
    media = { kind: "rejected", reason: "Format non supporte. Envoyez une photo (JPEG/PNG) ou un PDF." };
  } else {
    const stored = saveMediaBuffer(req.file.buffer, req.file.mimetype);
    media = { kind: "file", filename: stored.filename, contentType: stored.contentType };
  }

  const reply = dispatch(phone, "", media);
  res.json({ reply });
});
