import { FARMER_STATUS } from "../../../enums/farmer-status.js";
import { SNAPSHOT_KEY } from "../constants.js";
import { byBalanceDescending } from "../summary.js";
import db from "../../../db/models/index.js";
import logger from "../../logger.js";

/** The loaded accounts a loop may work, read from the stored snapshots, fullest pool first
 * @param {import("../AutoContext.js").default} ctx
 * @param {object} params
 * @param {{ accounts: Map<string, object> }} params.vault - the loaded wallets
 * @param {Set<string>} params.excludeIds - accounts passed over without counting, e.g. the helpers
 * @param {boolean} params.allowFrozen - whether a frozen farmer may still be worked
 * @param {(entry: { row: object, account: object, snapshot: object }) => string | object} params.accept -
 *   returns a skip reason, or the candidate to queue
 */
export async function scanCandidates(
  ctx,
  { vault, excludeIds, allowFrozen, accept },
) {
  const rows = await db.Farmer.findAll({
    where: { farmer: ctx.farmerId },
    attributes: ["id", "accountId", "status", "storage"],
    include: [
      {
        required: true,
        association: "account",
        attributes: ["id", "options"],
      },
    ],
  });

  const candidates = [];

  /** Why each account was passed over, so an empty cycle can say so */
  const skipped = {};
  const skip = (reason) => {
    skipped[reason] = (skipped[reason] || 0) + 1;
  };

  for (const row of rows) {
    const userId = String(row.account.id);

    /** Working an account needs its phrase, both to send and to reconnect */
    const account = vault.accounts.get(userId);

    if (!account) {
      skip("not loaded");
      continue;
    }

    /** Verified accounts are kept free to withdraw for everyone else */
    if (excludeIds.has(userId)) continue;

    if (row.status === FARMER_STATUS.BANNED) {
      skip(FARMER_STATUS.BANNED);
      continue;
    }

    /** Frozen is the operator saying to leave this account alone */
    if (row.status === FARMER_STATUS.FROZEN && !allowFrozen) {
      skip(FARMER_STATUS.FROZEN);
      continue;
    }

    /** An account that no longer farms has no fresh snapshot to trust */
    if (!row.account.farmingEnabled) {
      skip("farming off");
      continue;
    }

    const snapshot = row.storage?.[SNAPSHOT_KEY];

    if (!snapshot) {
      skip("never farmed");
      continue;
    }

    if (snapshot.banned) {
      skip("banned by the drop");
      continue;
    }

    const accepted = accept({ row, account, snapshot });

    if (typeof accepted === "string") {
      skip(accepted);
      continue;
    }

    candidates.push(accepted);
  }

  logger.info(
    `${ctx.title} - ${candidates.length} candidate(s) of ${rows.length}`,
    Object.entries(skipped)
      .map(([reason, count]) => `${count} ${reason}`)
      .join(", ") || "",
  );

  return candidates.sort(byBalanceDescending);
}
