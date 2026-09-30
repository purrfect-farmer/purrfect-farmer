import Decimal from "decimal.js";

/** Whether an unverified account has earned trust through its payout record alone */
export function isTrusted(summary) {
  const withdrawal = summary?.withdrawal;

  return Boolean(
    !summary?.verified &&
    typeof withdrawal?.approved === "number" &&
    withdrawal.approved > 0 &&
    !withdrawal.flagged?.length,
  );
}

/** Whether an account's balance has reached the drop's withdrawal minimum */
export function isWithdrawable(summary) {
  if (!summary?.minWithdrawal) return false;
  return new Decimal(summary.balance || 0).greaterThanOrEqualTo(
    summary.minWithdrawal,
  );
}

/** The drop keeps taking withdrawals while both of these hold */
export function isProtectedBuyer(summary) {
  const protection = summary?.protection;

  return Boolean(protection && !protection.revoked && protection.dexBuyer);
}

/** Whether a pass actually placed a withdrawal for this account */
export function didWithdraw(result) {
  return Boolean(result?.withdrawal?.status && !result.withdrawal.skipped);
}

/** The fullest pool first */
export function byBalanceDescending(a, b) {
  return new Decimal(b.snapshot.balance || 0).comparedTo(
    a.snapshot.balance || 0,
  );
}
