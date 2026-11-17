import { WALLET_ROLE } from "@purrfect/shared/enums/wallet-role.js";
import { deriveWalletFromTelegramId } from "@purrfect/shared/lib/ton/wallet.js";
import app from "../../config/app.js";
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

/** The wallet derived from the account's Telegram ID, or null when auto-connect is off or has no passphrase */
export function getDerivedAutoWallet(accountId) {
  const { autoConnect, passphrase } = app.derivedWallet;

  if (!autoConnect) return null;

  return deriveWalletFromTelegramId(accountId, passphrase);
}

/** The wallet an Auto drop connects for an account: the pushed one, else the derived one */
export async function getAccountAutoWallet(accountId, autoId) {
  return (
    (await getStoredAutoWallet(accountId, autoId)) ??
    (await getDerivedAutoWallet(accountId))
  );
}
