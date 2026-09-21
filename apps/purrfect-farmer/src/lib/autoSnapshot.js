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
    approved:
      typeof withdrawal?.approved === "number" ? withdrawal.approved : null,
    flagged: withdrawal?.flagged || [],
  };
};

/** Whether the account has earned trust through its payout record alone, absent until the drop counts it */
export const getWithdrawalTrust = (snapshot) => {
  const { known, approved, flagged } = getWithdrawals(snapshot);

  if (!known || approved === null) return null;

  return {
    approved,
    /** Only worth saying about an account the drop has not verified itself */
    trusted: !snapshot?.verified && approved > 0 && flagged.length === 0,
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

/** Convert value to a Decimal */
const toFigure = (value) => {
  try {
    return new Decimal(value || 0);
  } catch {
    return new Decimal(0);
  }
};

/** Sum up the mined and holding for all accounts */
export const sumSnapshots = (accounts, snapshots) =>
  (accounts || []).reduce(
    (result, account) => {
      const snapshot =
        account?.userId && snapshots?.get(String(account.userId))?.snapshot;

      if (!snapshot) return result;

      return {
        count: result.count + 1,
        mined: result.mined.plus(toFigure(snapshot.balance)),
        holding: result.holding.plus(toFigure(snapshot.holding)),
      };
    },
    {
      count: 0,
      mined: new Decimal(0),
      holding: new Decimal(0),
    },
  );
