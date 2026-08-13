import { Router } from "express";
import { dispatch, getChatHistory } from "../bot/stateMachine.js";

export const chatRouter = Router();

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
