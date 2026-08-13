import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { migrate } from "./db/migrate.js";
import { chatRouter } from "./routes/chat.js";
import { adminRouter } from "./routes/admin.js";
import { devRouter } from "./routes/dev.js";
import { whatsappRouter } from "./routes/whatsappWebhook.js";
import { startLateLoanCheckJob } from "./jobs/lateLoanCheck.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

migrate();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(join(__dirname, "..", "public")));

app.use("/api/chat", chatRouter);
app.use("/api/admin", adminRouter);
app.use("/api/dev", devRouter);
app.use("/webhook/whatsapp", whatsappRouter);

startLateLoanCheckJob();

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
app.listen(port, () => {
  console.log(`Soutraly prototype en ecoute sur http://localhost:${port}`);
});
