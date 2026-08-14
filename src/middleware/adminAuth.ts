import type { Request, Response, NextFunction } from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import { ADMIN_USERNAME, ADMIN_PASSWORD } from "../config/admin.js";

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

// Compare des digests de longueur fixe plutot que les chaines brutes : evite
// les fuites d'information par timing ET les soucis de comparaison entre
// chaines de longueurs differentes.
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("Authorization") ?? "";
  const [scheme, encoded] = header.split(" ");

  if (scheme === "Basic" && encoded) {
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    const separatorIndex = decoded.indexOf(":");
    const user = separatorIndex >= 0 ? decoded.slice(0, separatorIndex) : decoded;
    const pass = separatorIndex >= 0 ? decoded.slice(separatorIndex + 1) : "";

    if (safeEqual(user, ADMIN_USERNAME) && safeEqual(pass, ADMIN_PASSWORD)) {
      next();
      return;
    }
  }

  res.set("WWW-Authenticate", 'Basic realm="Soutraly Admin"');
  res.status(401).send("Authentification requise.");
}
