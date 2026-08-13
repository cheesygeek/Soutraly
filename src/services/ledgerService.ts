import {
  ORIGINATION_FEE_PERCENT,
  SERVICE_FEE_PERCENT,
  LATE_FEE_FLAT_XOF,
} from "../config/fees.js";

export function computeOriginationFee(amount: number): number {
  return Math.round(amount * ORIGINATION_FEE_PERCENT);
}

export function computeServiceFee(amount: number): number {
  return Math.round(amount * SERVICE_FEE_PERCENT);
}

export function computeLateFee(): number {
  return LATE_FEE_FLAT_XOF;
}
