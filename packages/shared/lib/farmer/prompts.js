import Decimal from "decimal.js";

/** Ask which wallet contract version the phrase was loaded with
 * @param {ReturnType<import("./createFarmerCore.js").default>} core
 * @returns {Promise<string|undefined>} - "5" or "4", or nothing when cancelled
 */
export function promptWalletVersion(core) {
  return core.prompt({
    type: "select",
    text: "Select wallet version:",
    options: [
      { value: "5", label: "Wallet V5R1" },
      { value: "4", label: "Wallet V4" },
    ],
  });
}

/** Ask for a non-negative token amount, logging why an answer is refused
 * @param {ReturnType<import("./createFarmerCore.js").default>} core
 * @param {object} options
 * @param {string} options.question - what to ask
 * @param {string} options.token - the token the amount is in, for the refusal messages
 * @param {string|null} [options.emptyMessage] - warned when nothing is entered, or null to stay quiet
 * @returns {Promise<Decimal|null>}
 */
export async function promptAmount(
  core,
  { question, token, emptyMessage = null },
) {
  const trimmed = ((await core.prompt(question)) || "").trim();

  if (!trimmed) {
    if (emptyMessage) core.logger.warn(emptyMessage);
    return null;
  }

  let amount;

  try {
    amount = new Decimal(trimmed);
  } catch {
    core.logger.error(`Invalid ${token} amount:`, trimmed);
    return null;
  }

  if (amount.isNegative()) {
    core.logger.error(`${token} amount must be non-negative`);
    return null;
  }

  return amount;
}
