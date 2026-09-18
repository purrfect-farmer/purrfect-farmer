import Decimal from "decimal.js";

/** A drop figure is a string, and a drop that reports nothing yields a dash */
export const formatFigure = (value) => {
  try {
    return new Decimal(value || 0).toFixed(2);
  } catch {
    return "-.--";
  }
};

/** Whether the drop reports a figure above zero */
export const hasValue = (value) => {
  try {
    return new Decimal(value || 0).greaterThan(0);
  } catch {
    return false;
  }
};

/** Whether the pool has reached the drop's minimum, as the server decides it */
export const isWithdrawable = (snapshot, minimum) => {
  if (!minimum) return false;

  try {
    return new Decimal(snapshot.balance || 0).greaterThanOrEqualTo(minimum);
  } catch {
    return false;
  }
};

/** How close a freeze has to be before it is worth flagging */
const FREEZE_WARNING_MS = 6 * 60 * 60 * 1000;

/** The mining freeze, with the snapshot's unix seconds resolved into a date here only */
export const getMiningFreeze = (snapshot) => {
  const mining = snapshot?.mining;

  if (!mining) return null;

  const frozen = Boolean(mining.frozen);
  const freezeSeconds = Number(mining.freezesAt) || 0;
  const freezesAt = freezeSeconds > 0 ? new Date(freezeSeconds * 1000) : null;
  const msUntilFreeze = freezesAt ? freezesAt.getTime() - Date.now() : null;

  return {
    frozen,
    freezesAt,
    msUntilFreeze,
    urgent:
      !frozen && msUntilFreeze !== null && msUntilFreeze <= FREEZE_WARNING_MS,
  };
};

/** The drop's buyer-protection standing, absent on drops that do not report it */
export const getProtection = (snapshot) => {
  const protection = snapshot?.protection;

  if (!protection) return null;

  return {
    revoked: Boolean(protection.revoked),
    dexBuyer: Boolean(protection.dexBuyer),
  };
};

/** The account's own withdrawal queue, and whether the drop reported it */
export const getWithdrawals = (snapshot) => {
  const withdrawal = snapshot?.withdrawal;

  return {
    known: Boolean(withdrawal),
    checkedAt: withdrawal?.checkedAt || null,
    pending: withdrawal?.pending || [],
    flagged: withdrawal?.flagged || [],
  };
};

/** `send_amount` -> `Send Amount`, matching how the farmer logs the same records */
const formatWithdrawalField = (key) =>
  key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

/** A withdrawal record as label/value pairs, since its fields are the drop's own */
export const formatWithdrawalRecord = (record) =>
  Object.entries(record || {})
    .filter(([, value]) => value !== null && typeof value !== "object")
    .map(([key, value]) => [formatWithdrawalField(key), String(value)]);
