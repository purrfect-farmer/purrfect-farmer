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

/** Delete the named wallets inside a transaction, only where they match what is stored */
export async function destroyAutoWallets(
  transaction,
  { ownerId, drop, wallets },
) {
  const rows = await db.Wallet.findAll({
    where: {
      drop,
      publicKey: {
        [Op.in]: wallets.map((wallet) => wallet.publicKey.toLowerCase()),
      },
    },
    transaction,
  });

  const rowsByKey = Map.groupBy(rows, (row) => row.publicKey);
  const removedIds = new Set();
  const missing = [];

  for (const request of wallets) {
    const publicKey = request.publicKey.toLowerCase();
    const candidates = rowsByKey.get(publicKey) || [];
    const row = candidates.find(
      (item) =>
        !removedIds.has(item.id) && matchesRemoval(item, request, ownerId),
    );

    if (row) {
      removedIds.add(row.id);
    } else {
      missing.push(publicKey);
    }
  }

  if (removedIds.size > 0) {
    await db.Wallet.destroy({
      where: { id: { [Op.in]: [...removedIds] } },
      transaction,
    });
  }

  return { removed: removedIds.size, missing };
}

/** Delete the Auto wallets a rotation left behind */
export function removeAutoWallets(removal) {
  return runDatabaseWrite((transaction) =>
    destroyAutoWallets(transaction, removal),
  );
}
