import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { db } from "./connection.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function migrate(): void {
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  db.exec(schema);
}
