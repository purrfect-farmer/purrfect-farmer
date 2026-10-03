import Decimal from "decimal.js";
import { toNano } from "@ton/core";

/** TON a native Auto's master keeps for fees, never counted as boostable */
export const NATIVE_TON_RESERVE = toNano("0.1");

/** Below this a sub account's TON is not worth the fee of returning it */
export const NATIVE_TON_DUST = toNano("0.01");

/** Whether a jetton address means the Auto moves native TON instead */
export function isNativeJetton(jettonAddress) {
  return !jettonAddress;
}

/** Whether an Auto descriptor pays out in native TON rather than a jetton */
export function isNativeAuto(auto) {
  return isNativeJetton(auto?.jettonAddress);
}

/** The unit the drop keeps its own balance in, which is the token unless the descriptor names one */
export function getAutoCurrency(auto) {
  return auto?.currency || auto?.token || "";
}

/** Nanotons as a TON amount */
export function fromNanoDecimal(value) {
  return new Decimal(String(value ?? 0)).div(1e9);
}
