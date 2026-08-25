import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { migrate } from "./db/migrate.js";
import { chatRouter } from "./routes/chat.js";
import { adminRouter } from "./routes/admin.js";
import { devRouter } from "./routes/dev.js";
import { whatsappRouter } from "./routes/whatsappWebhook.js";
import { mobileAuthRouter } from "./routes/mobileAuth.js";
import { mobileApiRouter } from "./routes/mobileApi.js";
import { adminAuth } from "./middleware/adminAuth.js";
import { startLateLoanCheckJob } from "./jobs/lateLoanCheck.js";
import { startLoanReminderJob } from "./jobs/loanReminderJob.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

migrate();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Doit etre monte avant express.static pour proteger /admin.html : sinon les
// fichiers statiques repondraient avant que ce middleware ne s'execute.
app.use(["/admin.html", "/api/admin"], adminAuth);

app.use(express.static(join(__dirname, "..", "public")));

app.use("/api/chat", chatRouter);
app.use("/api/admin", adminRouter);
app.use("/api/dev", devRouter);
app.use("/webhook/whatsapp", whatsappRouter);
app.use("/api/mobile/auth", mobileAuthRouter);
app.use("/api/mobile", mobileApiRouter);

startLateLoanCheckJob();
startLoanReminderJob();

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
app.listen(port, () => {
  console.log(`Soutraly prototype en ecoute sur http://localhost:${port}`);
});
