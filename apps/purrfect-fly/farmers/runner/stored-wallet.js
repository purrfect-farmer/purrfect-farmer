import { WALLET_ROLE } from "@purrfect/shared/enums/wallet-role.js";
import db from "../../db/models/index.js";
import serverCipher from "../../lib/ServerCipher.js";

/** The wallet pushed for an account on an Auto drop, decrypted, or null when none is stored */
export async function getStoredAutoWallet(accountId, autoId) {
  if (!serverCipher.isAvailable()) return null;

  const row = await db.Wallet.findOne({
    where: {
      accountId: String(accountId),
      drop: autoId,
      role: WALLET_ROLE.ACCOUNT,
    },
    order: [["updatedAt", "DESC"]],
  });

  if (!row) return null;

  return {
    phrase: await serverCipher.decrypt(row.encryptedPhrase),
    address: row.address,
    version: row.version,
  };
}
