import { WALLET_CHAIN } from "@purrfect/shared/enums/wallet-chain.js";
import { Op } from "sequelize";
import Encrypter from "@purrfect/shared/lib/Encrypter.js";
import db from "../../db/models/index.js";
import { getAutoWalletEntries } from "./auto-wallet-entries.js";
import { getTonWalletIdentity } from "./wallet-identity.js";
import { runDatabaseWrite } from "../../lib/db-write.js";
import serverCipher from "../../lib/ServerCipher.js";

/** Thrown when the Auto's password cannot open one of its wallets */
export class WalletDecryptionError extends Error {
  constructor() {
    super("Invalid password or corrupted wallet");
    this.name = "WalletDecryptionError";
  }
}

/** Decrypt one Auto phrase with the Auto's password */
async function decryptAutoPhrase(encryptedPhrase, password) {
  try {
    return await Encrypter.decryptData({
      ...encryptedPhrase,
      password,
      asText: true,
    });
  } catch {
    throw new WalletDecryptionError();
  }
}

/** Decrypt and identify each wallet one at a time, since scrypt is memory hungry */
async function prepareWallets(entries, password) {
  const wallets = [];

  for (const entry of entries) {
    const phrase = await decryptAutoPhrase(entry.encryptedPhrase, password);
    const identity = await getTonWalletIdentity(phrase, entry.version);

    wallets.push({
      role: entry.role,
      accountId: entry.accountId,
      version: entry.version,
      chain: WALLET_CHAIN.TON,
      ...identity,
      encryptedPhrase: serverCipher.encrypt(phrase),
    });
  }

  return wallets;
}

/** Create or update each wallet, matched by drop and public key */
function storeWallets({ ownerId, drop, wallets }) {
  return runDatabaseWrite(async (transaction) => {
    const existing = await db.Wallet.findAll({
      where: {
        drop,
        publicKey: { [Op.in]: wallets.map((wallet) => wallet.publicKey) },
      },
      transaction,
    });
    const existingByKey = new Map(
      existing.map((wallet) => [wallet.publicKey, wallet]),
    );

    let created = 0;
    let updated = 0;

    for (const wallet of wallets) {
      const values = { ...wallet, ownerId: String(ownerId), drop };
      const row = existingByKey.get(wallet.publicKey);

      if (row) {
        await row.update(values, { transaction });
        updated++;
      } else {
        const createdRow = await db.Wallet.create(values, { transaction });

        /** A phrase named twice in one push updates the row it just created */
        existingByKey.set(wallet.publicKey, createdRow);
        created++;
      }
    }

    return { created, updated };
  });
}

/** Store the Auto wallets a push names, under the server's encryption key */
export async function pushAutoWallets({
  ownerId,
  drop,
  password,
  master,
  accounts,
  pushScope,
}) {
  serverCipher.assertAvailable();

  const entries = getAutoWalletEntries({ master, accounts, pushScope });
  const wallets = await prepareWallets(entries, password);

  return storeWallets({ ownerId, drop, wallets });
}
