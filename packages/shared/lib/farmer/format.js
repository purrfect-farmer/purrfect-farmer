import Decimal from "decimal.js";

/** The periods a daily mining rate is spread across, as label and multiple of a day */
const MINING_RATE_PERIODS = [
  ["Per Second", new Decimal(1).div(86400)],
  ["Per Minute", new Decimal(1).div(1440)],
  ["Per Hour", new Decimal(1).div(24)],
  ["Per Day", new Decimal(1)],
  ["Per 3 Days", new Decimal(3)],
  ["Per Week (7d)", new Decimal(7)],
  ["Per Month (30d)", new Decimal(30)],
];

/** Format a token amount, keeping sub-1 values readable */
export function formatAmount(value) {
  const amount = new Decimal(value || 0);

  return amount
    .toDecimalPlaces(amount.abs().greaterThanOrEqualTo(1) ? 4 : 8)
    .toString();
}

/** Format account link (Telegram HTML) */
export function formatAccountLink(id) {
  return `<a href="tg://user?id=${id}">${id}</a>`;
}

/** Log a daily mining rate spread across every period */
export function logMiningRateBreakdown(logger, dailyRate) {
  for (const [label, multiplier] of MINING_RATE_PERIODS) {
    logger.keyValue(
      label,
      formatAmount(new Decimal(dailyRate).times(multiplier)),
      { valueStyle: logger.c.greenBright },
    );
  }
}

/** Log the Telegram user the farmer runs as */
export function logCurrentUser(logger, user) {
  logger.keyValue("User", `${user.username || "(no-username)"} (${user.id})`);
}
