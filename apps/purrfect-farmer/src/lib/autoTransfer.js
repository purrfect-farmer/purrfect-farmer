/**
 * Moving wallets between Auto drops.
 *
 * The drops are mechanically identical — a TON wallet whose jetton holding
 * drives the miner level — and one wallet can hold every drop's jetton at once,
 * so the accounts curated for one drop are usually the accounts wanted for the
 * next. This module owns the transfer payload and the merge maths; encryption
 * and storage live in `useAutoImportMutation`.
 *
 * Deliberately dependency-free so it can be exercised outside the bundler.
 */

export const EXPORT_TYPE = "purrfect-auto-export";
export const EXPORT_VERSION = 1;

/** How incoming accounts that already exist in the destination are handled */
export const MERGE_STRATEGIES = ["skip", "overwrite", "replace"];

export const MERGE_STRATEGY_LABELS = {
  skip: "Keep existing accounts",
  overwrite: "Overwrite existing accounts",
  replace: "Replace all accounts",
};

/**
 * `crypto.randomUUID` rather than the app's `uuid` helper, so this module keeps
 * no imports. Same underlying source — `uuid` delegates to it where available.
 */
const makeId = () => crypto.randomUUID();

/** The fields of an account that are worth carrying across */
function pickAccount(account) {
  return {
    id: account.id,
    title: account.title,
    userId: account.userId,
    version: account.version,
    address: account.address,
    encryptedPhrase: account.encryptedPhrase,
  };
}

/** The fields of a master that are worth carrying across */
function pickMaster(master) {
  return {
    address: master.address,
    version: master.version,
    hashedPassword: master.hashedPassword,
    encryptedWalletPhrase: master.encryptedWalletPhrase,
    tonCenterApiKey: master.tonCenterApiKey || "",
  };
}

/**
 * Builds a transfer payload. Phrases are copied as the stored
 * `{ encrypted, salt }` blobs, so the result is only usable by someone holding
 * the source drop's password.
 */
export function createBundle({ config, master = null, accounts = [] }) {
  return {
    type: EXPORT_TYPE,
    version: EXPORT_VERSION,
    auto: config.id,
    title: config.title,
    exportedAt: new Date().toISOString(),
    master: master ? pickMaster(master) : null,
    accounts: accounts.map(pickAccount),
  };
}

/** Throws unless `data` is a bundle this build understands */
export function validateBundle(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Not a valid export file.");
  }

  if (data.type !== EXPORT_TYPE) {
    throw new Error("This file is not an Auto export.");
  }

  if (data.version > EXPORT_VERSION) {
    throw new Error(
      `Export version ${data.version} is newer than this build supports. Update the farmer.`,
    );
  }

  if (data.master === null && !data.accounts?.length) {
    throw new Error("This export is empty.");
  }

  if (data.accounts && !Array.isArray(data.accounts)) {
    throw new Error("This export has a malformed accounts list.");
  }

  return data;
}

/**
 * Whether two accounts are the same farmed account.
 *
 * The Telegram user id is the real identity — the same person farms every drop
 * under it — but it is a number from `AutoAccountForm` and a string elsewhere,
 * hence the coercion. Address is the fallback for accounts saved without one.
 */
export function matchAccount(a, b) {
  if (a.userId && b.userId && String(a.userId) === String(b.userId)) {
    return true;
  }

  return Boolean(a.address) && a.address === b.address;
}

/**
 * Folds `incoming` into `existing`.
 *
 * Overwriting keeps the destination account's `id` — the accounts list, the
 * chooser and cloud results all key off it — and takes everything else from the
 * incoming account, which is what makes a re-import the way to re-sync after
 * rotating wallets in the source drop.
 */
export function mergeAccounts(existing = [], incoming = [], strategy = "skip") {
  if (!MERGE_STRATEGIES.includes(strategy)) {
    throw new Error(`Unknown merge strategy: ${strategy}`);
  }

  const accounts = strategy === "replace" ? [] : [...existing];
  const summary = { added: 0, updated: 0, skipped: 0 };

  for (const account of incoming) {
    const index = accounts.findIndex((item) => matchAccount(item, account));

    if (index !== -1) {
      if (strategy === "skip") {
        summary.skipped += 1;
      } else {
        accounts[index] = { ...account, id: accounts[index].id };
        summary.updated += 1;
      }
      continue;
    }

    /** A stale id from a previous import must not collide with a live one */
    const id = accounts.some((item) => item.id === account.id)
      ? makeId()
      : account.id || makeId();

    accounts.push({ ...account, id });
    summary.added += 1;
  }

  return { accounts, ...summary };
}

/** Human-readable rundown of a merge, for the success toast */
export function formatMergeSummary({ added, updated, skipped }) {
  return [
    `${added} added`,
    updated ? `${updated} updated` : null,
    skipped ? `${skipped} skipped` : null,
  ]
    .filter(Boolean)
    .join(", ");
}
