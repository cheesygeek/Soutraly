import type { Request, Response, NextFunction } from "express";
import { getValidAuthToken } from "../db/queries/authTokens.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      mobileAuth?: { phoneNumber: string; userId: number | null };
    }
  }
}

// Verifie le jeton Bearer emis apres OTP. userId peut etre null tant que
// l'inscription (nom + KYC) n'est pas terminee - a verifier explicitement
// dans les routes qui exigent un profil complet.
export function mobileAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header("Authorization") ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Authentification requise." });
    return;
  }

  const authToken = getValidAuthToken(token);
  if (!authToken) {
    res.status(401).json({ error: "Session invalide ou expiree." });
    return;
  }

  req.mobileAuth = { phoneNumber: authToken.phone_number, userId: authToken.user_id };
  next();
}

// A utiliser apres mobileAuth pour les routes qui exigent un profil complet.
export function requireRegisteredUser(req: Request, res: Response, next: NextFunction): void {
  if (!req.mobileAuth?.userId) {
    res.status(403).json({ error: "Inscription incomplete." });
    return;
  }
  next();
}
