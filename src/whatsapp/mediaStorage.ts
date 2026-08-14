import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } from "../config/whatsapp.js";

// Vit a cote du fichier SQLite par defaut, donc sur le meme volume persistant
// sans variable d'env supplementaire a configurer sur Railway.
const dbPath = process.env.DB_PATH ?? "./data/soutraly.db";
export const KYC_UPLOAD_DIR = process.env.KYC_UPLOAD_DIR ?? join(dirname(dbPath), "kyc-uploads");
mkdirSync(KYC_UPLOAD_DIR, { recursive: true });

export const MAX_MEDIA_BYTES = 10 * 1024 * 1024; // 10 Mo

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

export function isAllowedContentType(contentType: string): boolean {
  return contentType in EXTENSION_BY_CONTENT_TYPE;
}

export interface StoredMedia {
  filename: string;
  contentType: string;
}

export class MediaTooLargeError extends Error {}
export class MediaFetchError extends Error {}

function generateFilename(contentType: string): string {
  const ext = EXTENSION_BY_CONTENT_TYPE[contentType] ?? "";
  return `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
}

// Le nom de fichier est toujours genere ici, jamais derive d'une entree
// utilisateur (nom original, chemin...) : aucune traversee de repertoire possible.
export function saveMediaBuffer(buffer: Buffer, contentType: string): StoredMedia {
  const filename = generateFilename(contentType);
  writeFileSync(join(KYC_UPLOAD_DIR, filename), buffer);
  return { filename, contentType };
}

// Les URLs media de Twilio exigent une authentification HTTP Basic
// (Account SID / Auth Token) et ne sont pas garanties disponibles indefiniment
// - on telecharge et sauvegarde nous-memes des la reception.
export async function downloadTwilioMedia(mediaUrl: string, contentType: string): Promise<StoredMedia> {
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let response: globalThis.Response;
  try {
    response = await fetch(mediaUrl, {
      headers: { Authorization: `Basic ${auth}` },
      signal: controller.signal,
    });
  } catch (err) {
    throw new MediaFetchError(`Echec du telechargement du media Twilio : ${(err as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new MediaFetchError(`Twilio a repondu ${response.status} pour ${mediaUrl}`);
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_MEDIA_BYTES) {
    throw new MediaTooLargeError("Fichier trop volumineux (max 10 Mo).");
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_MEDIA_BYTES) {
    throw new MediaTooLargeError("Fichier trop volumineux (max 10 Mo).");
  }

  return saveMediaBuffer(Buffer.from(arrayBuffer), contentType);
}
