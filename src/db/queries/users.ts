import { db } from "../connection.js";

export type Role = "borrower" | "lender";
export type KycStatus = "pending" | "submitted" | "verified" | "rejected";

export interface User {
  id: number;
  phone_number: string;
  name: string | null;
  role: Role | null;
  kyc_status: KycStatus;
  kyc_proof_stub: string | null;
  /** @deprecated remplace par kyc_id_media_* / kyc_contract_media_*, conserve pour les inscriptions anterieures */
  kyc_media_filename: string | null;
  /** @deprecated voir kyc_media_filename */
  kyc_media_content_type: string | null;
  kyc_id_media_filename: string | null;
  kyc_id_media_content_type: string | null;
  kyc_contract_media_filename: string | null;
  kyc_contract_media_content_type: string | null;
  created_at: string;
}

export function getUserByPhone(phone: string): User | undefined {
  return db.prepare("SELECT * FROM users WHERE phone_number = ?").get(phone) as User | undefined;
}

export function getUserById(id: number): User | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined;
}

export function createUser(params: {
  phone: string;
  name: string;
  role: Role;
  kycIdMediaFilename: string;
  kycIdMediaContentType: string;
  kycContractMediaFilename?: string;
  kycContractMediaContentType?: string;
}): User {
  const info = db
    .prepare(
      `INSERT INTO users (
         phone_number, name, role, kyc_status,
         kyc_id_media_filename, kyc_id_media_content_type,
         kyc_contract_media_filename, kyc_contract_media_content_type
       )
       VALUES (?, ?, ?, 'verified', ?, ?, ?, ?)`
    )
    .run(
      params.phone,
      params.name,
      params.role,
      params.kycIdMediaFilename,
      params.kycIdMediaContentType,
      params.kycContractMediaFilename ?? null,
      params.kycContractMediaContentType ?? null
    );
  return getUserById(info.lastInsertRowid as number)!;
}

export function listUsers(): User[] {
  return db.prepare("SELECT * FROM users ORDER BY created_at DESC").all() as User[];
}
