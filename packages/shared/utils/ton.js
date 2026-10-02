import { Address } from "@ton/core";

/** Friendly addresses, mainnet (EQ/UQ) and testnet (kQ/0Q) */
const FRIENDLY_ADDRESS_PATTERN = /^[UEk0][Qq][A-Za-z0-9_-]{46}$/;

/** Friendly addresses on mainnet only */
const MAINNET_FRIENDLY_ADDRESS_PATTERN = /^[UE]Q[A-Za-z0-9_-]{46}$/;

/** Raw `workchain:hex` addresses */
const RAW_ADDRESS_PATTERN = /^-?\d+:[a-fA-F0-9]{64}$/;

/** Whether a value is shaped like a TON address, optionally refusing raw or testnet forms */
export function isTonAddress(address, { raw = true, testnet = true } = {}) {
  const value = String(address || "").trim();
  const friendly = testnet
    ? FRIENDLY_ADDRESS_PATTERN
    : MAINNET_FRIENDLY_ADDRESS_PATTERN;

  return friendly.test(value) || (raw && RAW_ADDRESS_PATTERN.test(value));
}

/** Any address form as friendly, non-bounceable (`UQ...`) by default, or the input when it cannot be parsed */
export function toFriendlyAddress(address, { bounceable = false } = {}) {
  try {
    return Address.parse(address).toString({ bounceable });
  } catch {
    return address;
  }
}

/** Any address form as raw `0:hex`, or null when it cannot be parsed */
export function toRawAddress(address) {
  try {
    return Address.parse(address).toRawString();
  } catch {
    return null;
  }
}

/** Whether two addresses point at the same account, whatever form each is in */
export function isSameTonAddress(first, second) {
  try {
    return Address.parse(first).equals(Address.parse(second));
  } catch {
    return false;
  }
}
