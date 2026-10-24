import { WALLET_CHAIN } from "@purrfect/shared/enums/wallet-chain.js";
import { Op } from "sequelize";
import Encrypter from "@purrfect/shared/lib/Encrypter.js";
import db from "../../db/models/index.js";
import JobNotifier from "../../lib/bot/JobNotifier.js";
import logger from "../../lib/logger.js";
import { WALLET_ROLE } from "@purrfect/shared/enums/wallet-role.js";
import { destroyAutoWallets } from "./remove-auto-wallets.js";
import { getAutoWalletEntries } from "./auto-wallet-entries.js";
import { getTonWalletIdentity } from "./wallet-identity.js";
import { runDatabaseWrite } from "../../lib/db-write.js";
import serverCipher from "../../lib/ServerCipher.js";
import utils from "../../lib/utils.js";

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

/** Which wallet an entry is, for progress messages */
const describeEntry = (entry) =>
  entry.role === WALLET_ROLE.MASTER
    ? "<b>Wallet</b>: Master"
    : `<b>Wallet</b>: Account <code>${entry.accountId}</code>`;

/** One wallet ready to store: identified on the server and encrypted under its key */
async function prepareWallet(entry, phrase) {
  const identity = await getTonWalletIdentity(phrase, entry.version);

  return {
    role: entry.role,
    accountId: entry.accountId,
    version: entry.version,
    chain: WALLET_CHAIN.TON,
    ...identity,
    encryptedPhrase: await serverCipher.encrypt(phrase),
  };
}

/** Decrypt and prepare each wallet one at a time, since scrypt is memory hungry */
async function prepareWallets({ entries, firstPhrase, password, notifier }) {
  const wallets = [];

  for (const [index, entry] of entries.entries()) {
    try {
      const phrase =
        index === 0
          ? firstPhrase
          : await decryptAutoPhrase(entry.encryptedPhrase, password);
      const wallet = await prepareWallet(entry, phrase);

      wallets.push(wallet);
      notifier.step({
        icon: "🔐",
        label: "Encrypted for the server",
        lines: [
          describeEntry(entry),
          `<b>Address</b>: <code>${utils.escapeHtml(wallet.address)}</code>`,
        ],
      });
    } catch (error) {
      notifier.fail(`${describeEntry(entry)}\n${error.message}`);
      throw error;
    }
  }

  return wallets;
}

/** The replaced wallets to delete, leaving any the push stores again */
function getStaleWallets(replaces, wallets) {
  const storedKeys = new Set(wallets.map((wallet) => wallet.publicKey));

  return replaces.filter(
    (wallet) => !storedKeys.has(wallet.publicKey.toLowerCase()),
  );
}

/** Create or update each wallet, matched by drop and public key, then delete the ones it replaces */
function storeWallets({ ownerId, drop, wallets, replaces }) {
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

    const stale = getStaleWallets(replaces, wallets);
    const { removed } =
      stale.length > 0
        ? await destroyAutoWallets(transaction, {
            ownerId,
            drop,
            wallets: stale,
          })
        : { removed: 0 };

    return { created, updated, removed };
  });
}

/** Pushes run one after another, so two never hold scrypt memory at once */
let pushChain = Promise.resolve();

/** Check a push before it is accepted: the scope names wallets and the password opens the first */
export async function checkAutoWalletsPush({
  password,
  master,
  accounts,
  pushScope,
}) {
  serverCipher.assertAvailable();

  const entries = getAutoWalletEntries({ master, accounts, pushScope });
  const firstPhrase = await decryptAutoPhrase(
    entries[0].encryptedPhrase,
    password,
  );

  return { entries, firstPhrase };
}

/** Store a checked push in the background, reporting its progress and outcome */
async function runAutoWalletsPush({
  title,
  ownerId,
  drop,
  pushScope,
  replaces,
  ...push
}) {
  const notifier = new JobNotifier({
    title: `🔐 ${title} - Wallet Push`,
    total: push.entries.length,
    operatorId: ownerId,
  });

  notifier.start([`<b>Scope</b>: ${pushScope}`]);

  try {
    const wallets = await prepareWallets({ ...push, notifier });
    let result;

    try {
      result = await storeWallets({ ownerId, drop, wallets, replaces });
    } catch (error) {
      notifier.fail("The wallets could not be saved.");
      throw error;
    }

    await notifier.complete([
      `<b>Created</b>: ${result.created}`,
      `<b>Updated</b>: ${result.updated}`,
      ...(replaces.length > 0 ? [`<b>Removed</b>: ${result.removed}`] : []),
    ]);
  } catch (error) {
    logger.error("Wallet push failed:", error?.message || error);
  }
}

/** Queue a checked push, resolving once it has run */
export function startAutoWalletsPush(push) {
  pushChain = pushChain.then(() => runAutoWalletsPush(push));

  return pushChain;
}
