import { isTrusted, isWithdrawable } from "../summary.js";

/** Format when an account's mining freezes, empty for drops that report no mining window */
function formatMiningFreeze(fmt, summary) {
  const mining = summary?.mining;

  if (mining?.frozen) {
    return "🧊 Mining is <b>frozen</b>";
  }

  const freezesAt = Number(mining?.freezesAt) || 0;

  if (!freezesAt) return "";

  return `❄️ Freezes <i>${fmt.formatTimestamp(freezesAt)}</i> - in <i>${fmt.formatCountdown(freezesAt)}</i>`;
}

/** The payout record an unverified account has earned, absent until the drop counts it */
function formatWithdrawalRecord(fmt, summary) {
  const withdrawal = summary?.withdrawal;
  const approved =
    typeof withdrawal?.approved === "number" ? withdrawal.approved : null;

  if (approved === null) return "";

  /** A verified account already says as much, so this only speaks for the rest */
  if (isTrusted(summary)) {
    return fmt.formatKeyValue(
      "Withdrawal Record",
      `🤝 Trusted - ${approved} approved, none ever flagged`,
    );
  }

  return fmt.formatKeyValue("Withdrawal Record", `${approved} approved`);
}

/** Format an account snapshot as notification detail lines, shared by every single-account notification */
export function formatSummaryDetails(fmt, summary) {
  const freeze = formatMiningFreeze(fmt, summary);
  const record = formatWithdrawalRecord(fmt, summary);

  return (
    [
      fmt.formatKeyValue("Miner Level", summary.level),
      fmt.formatKeyValue("Holding", `${summary.holding} ${fmt.token}`),
      fmt.formatKeyValue(
        "Pool Balance",
        `${summary.balance} ${fmt.currency} ${isWithdrawable(summary) ? "🟩" : "🟧"}`,
      ),
      fmt.formatKeyValue("Verified", summary.verified ? "✅" : "❌"),
    ]
      /** The account's own payout record, absent on a summary that carries no withdrawals */
      .concat(record ? [record] : [])

      /** Buyer protection, absent on drops that do not report it */
      .concat(
        summary.protection
          ? [
              fmt.formatKeyValue(
                "Buyer Protection",
                summary.protection.revoked ? "🚫 Revoked" : "✅ Active",
              ),
              fmt.formatKeyValue(
                "DEX Buyer",
                summary.protection.dexBuyer ? "✅" : "❌",
              ),
            ]
          : [],
      )

      /** Wallet */
      .concat(
        summary.wallet
          ? [fmt.formatKeyValue("Wallet", fmt.formatWallet(summary.wallet))]
          : [],
      )

      /** Mining freeze */
      .concat(freeze ? [freeze] : [])

      /** Ban */
      .concat(
        summary.banned
          ? [
              "",
              "<b>🚫 Banned</b>",
              fmt.formatKeyValue("Reason", summary.banReason || "Unknown"),
            ]
          : [],
      )

      /** Risks */
      .concat(
        summary.risk?.flags?.length > 0
          ? [
              "",
              "<b>🟥 Risks</b>",
              fmt.formatKeyValue("Risk Score", summary.risk.score),
              fmt.formatKeyValue("Risk Updated", summary.risk.updatedAt),
              fmt.formatKeyValue("Risk Flags", summary.risk.flags.length),
              ...summary.risk.flags.map((flag) => `<b>- ${flag}</b>`),
            ]
          : [],
      )
  );
}
