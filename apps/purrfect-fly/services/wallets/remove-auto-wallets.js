import { Op } from "sequelize";
import { WALLET_ROLE } from "@purrfect/shared/enums/wallet-role.js";
import db from "../../db/models/index.js";
import { runDatabaseWrite } from "../../lib/db-write.js";

/** Whether a stored wallet is the one a removal request names */
function matchesRemoval(row, request, ownerId) {
  if (row.role !== request.role) {
    return false;
  }

  if (request.role === WALLET_ROLE.MASTER) {
    return String(row.ownerId) === String(ownerId);
  }

  return String(row.accountId) === String(request.accountId);
}

/** Delete the Auto wallets a rotation left behind, only where they match what is stored */
export function removeAutoWallets({ ownerId, drop, wallets }) {
  return runDatabaseWrite(async (transaction) => {
    const rows = await db.Wallet.findAll({
      where: {
        drop,
        address: { [Op.in]: wallets.map((wallet) => wallet.address) },
      },
      transaction,
    });

    const rowsByAddress = Map.groupBy(rows, (row) => row.address);
    const removedIds = new Set();
    const missing = [];

    for (const request of wallets) {
      const candidates = rowsByAddress.get(request.address) || [];
      const row = candidates.find(
        (item) =>
          !removedIds.has(item.id) && matchesRemoval(item, request, ownerId),
      );

      if (row) {
        removedIds.add(row.id);
      } else {
        missing.push(request.address);
      }
    }

    if (removedIds.size > 0) {
      await db.Wallet.destroy({
        where: { id: { [Op.in]: [...removedIds] } },
        transaction,
      });
    }

    return { removed: removedIds.size, missing };
  });
}
