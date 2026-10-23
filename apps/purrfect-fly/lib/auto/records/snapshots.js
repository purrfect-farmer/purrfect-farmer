import {
  ASSIST_HELPED_KEY,
  ASSIST_RECORD_KEY,
  LAST_BOOST_KEY,
  SNAPSHOT_KEY,
} from "../constants.js";

import db from "../../../db/models/index.js";

/** What every account this server farms for the drop last looked like, from the stored snapshots */
export async function readSnapshots(farmerId) {
  const rows = await db.Farmer.findAll({
    where: { farmer: farmerId },
    attributes: [
      "id",
      "accountId",
      "status",
      "frozenUntil",
      "errorCount",
      "storage",
    ],
    include: [
      {
        required: true,
        association: "account",
        attributes: ["id", "options"],
      },
    ],
  });

  return rows.map((row) => ({
    /** A string, since the UI holds the Telegram id as one */
    id: String(row.account.id),
    status: row.status,
    frozenUntil: row.frozenUntil,
    errorCount: row.errorCount,
    farming: row.account.farmingEnabled,
    snapshot: row.storage?.[SNAPSHOT_KEY] || null,

    /** What the last boost sent it, which a reuse would send again */
    lastBoost: row.storage?.[LAST_BOOST_KEY] || null,

    /** What it is carrying now, and who it last withdrew for */
    assist: {
      pending: row.storage?.[ASSIST_RECORD_KEY] || null,
      last: row.storage?.[ASSIST_HELPED_KEY] || null,
    },
  }));
}
