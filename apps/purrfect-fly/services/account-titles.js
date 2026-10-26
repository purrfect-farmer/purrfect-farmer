import { Op } from "sequelize";
import db from "../db/models/index.js";
import { normalizeTitleUpdates } from "@purrfect/shared/lib/account/titles.js";
import { runDatabaseWrite } from "../lib/db-write.js";

/** Set the titles of existing accounts in one serialized write, counting the ones changed and not found */
export async function updateAccountTitles(updates) {
  const titles = normalizeTitleUpdates(updates);

  return runDatabaseWrite(async (transaction) => {
    const accounts = await db.Account.findAll({
      where: { id: { [Op.in]: [...titles.keys()] } },
      attributes: ["id", "title"],
      transaction,
    });

    let updated = 0;

    for (const account of accounts) {
      const title = titles.get(Number(account.id));

      if (account.title === title) continue;

      await account.update({ title }, { transaction });
      updated += 1;
    }

    return { updated, missing: titles.size - accounts.length };
  });
}
