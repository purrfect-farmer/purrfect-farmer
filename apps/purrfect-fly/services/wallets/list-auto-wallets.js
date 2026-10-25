import { Op } from "sequelize";
import { WALLET_ROLE } from "@purrfect/shared/enums/wallet-role.js";
import db from "../../db/models/index.js";

/** The drop's stored wallets without their phrases, the caller's master and every account's */
export async function listAutoWallets({ ownerId, drop }) {
  const rows = await db.Wallet.findAll({
    where: {
      drop,
      [Op.or]: [
        { role: WALLET_ROLE.ACCOUNT },
        { role: WALLET_ROLE.MASTER, ownerId: String(ownerId) },
      ],
    },
    attributes: [
      "accountId",
      "role",
      "version",
      "publicKey",
      "address",
      "updatedAt",
    ],
  });

  return rows.map((row) => ({
    role: row.role,
    /** A string, since the UI holds the Telegram id as one */
    accountId: row.accountId ? String(row.accountId) : null,
    version: row.version,
    publicKey: row.publicKey,
    address: row.address,
    updatedAt: row.updatedAt,
  }));
}
