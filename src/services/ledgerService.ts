import { LATE_FEE_FLAT_XOF } from "../config/fees.js";

export function computeLateFee(): number {
  return LATE_FEE_FLAT_XOF;
}
