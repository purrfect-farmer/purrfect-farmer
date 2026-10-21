import Decimal from "decimal.js";

/** Why a collect moved nothing */
export const COLLECT_SKIP_REASONS = Object.freeze({
  EMPTY: "empty",
  RETAINED: "retained",
  BELOW_MINIMUM: "below-minimum",
});

/** A non-negative amount from a user-entered value, or null when it is empty or invalid */
function toAmount(value) {
  if (value === null || value === undefined || value === "") return null;

  try {
    const amount = new Decimal(value);
    return amount.isFinite() && amount.gte(0) ? amount : null;
  } catch {
    return null;
  }
}

/** What to leave on an account: nothing, a fixed amount, or a random amount within a range */
export function pickRetain({ retainMin, retainMax } = {}) {
  const min = toAmount(retainMin);
  const max = toAmount(retainMax);

  if (!min && !max) return new Decimal(0);
  if (!min || !max || min.eq(max)) return min || max;

  const low = Decimal.min(min, max);
  const high = Decimal.max(min, max);

  return low
    .plus(high.minus(low).mul(Decimal.random()))
    .toDecimalPlaces(4, Decimal.ROUND_DOWN);
}

/** How much of a balance to collect, and why nothing is when it comes to that */
export function planCollect(
  balance,
  { retainMin, retainMax, minCollect } = {},
) {
  const retain = pickRetain({ retainMin, retainMax });
  const minimum = toAmount(minCollect);

  if (balance.lte(0)) {
    return {
      amount: new Decimal(0),
      retain: new Decimal(0),
      reason: COLLECT_SKIP_REASONS.EMPTY,
    };
  }

  const amount = Decimal.max(balance.minus(retain), 0);

  if (amount.lte(0)) {
    return { amount, retain: balance, reason: COLLECT_SKIP_REASONS.RETAINED };
  }

  if (minimum && amount.lt(minimum)) {
    return { amount, retain, reason: COLLECT_SKIP_REASONS.BELOW_MINIMUM };
  }

  return { amount, retain, reason: null };
}
