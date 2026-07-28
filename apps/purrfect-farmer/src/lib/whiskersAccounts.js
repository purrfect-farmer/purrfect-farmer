/**
 * Reading Purrfect Whiskers backups as a list of Telegram accounts.
 *
 * Whiskers writes two kinds of file — a full backup and a selected accounts
 * export — and both carry a per-partition `backup` blob holding that session's
 * entire chrome storage. None of that is wanted here: an Auto account is a TON
 * wallet keyed by a Telegram user id, so the only thing worth reading is each
 * account's `telegramInitData`. Ignoring the blobs also keeps a 5 MB file cheap
 * to work with.
 *
 * Deliberately dependency-free, like `autoTransfer`, so it can be exercised
 * outside the bundler.
 */

/**
 * The Telegram user id inside a Mini App `initData` query string.
 *
 * `user` is URL-encoded JSON; anything malformed means the account can't be
 * matched to a wallet, so it is dropped rather than guessed at.
 */
export function parseTelegramUserId(initData) {
  if (!initData || typeof initData !== "string") {
    return null;
  }

  try {
    const user = new URLSearchParams(initData).get("user");

    if (!user) {
      return null;
    }

    const { id } = JSON.parse(user);

    return id ?? null;
  } catch {
    return null;
  }
}

/**
 * The account list out of either file shape.
 *
 * A full backup keeps accounts in `app.accounts` and the session blobs in a
 * separate `backups` array; a selected export inlines the account next to its
 * blob under `accounts[].account`. Neither `backups` nor `.backup` is read.
 */
function extractAccounts(data) {
  if (Array.isArray(data?.app?.accounts)) {
    return data.app.accounts;
  }

  if (Array.isArray(data?.accounts)) {
    return data.accounts.map((item) => item?.account || item);
  }

  return null;
}

/**
 * Tag names only exist in a full backup. A selected export carries the ids the
 * accounts reference but not the names, so the id doubles as the label.
 */
function extractTags(data, accounts) {
  if (Array.isArray(data?.app?.tags)) {
    return data.app.tags.filter((tag) => tag?.id);
  }

  const ids = new Set();

  for (const account of accounts) {
    for (const tag of account.tags || []) {
      ids.add(tag);
    }
  }

  return [...ids].map((id) => ({ id, name: id }));
}

/** Throws unless `data` is a Whiskers backup this build understands */
export function parseWhiskersBackup(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Not a valid Whiskers backup.");
  }

  const list = extractAccounts(data);

  if (!list) {
    throw new Error("This file is not a Whiskers backup or accounts export.");
  }

  if (!list.length) {
    throw new Error("This backup has no accounts.");
  }

  /**
   * The same Telegram account can occupy two partitions — a spare session, a
   * half-finished migration — and both would fold onto one wallet anyway, so
   * only the first is offered.
   */
  const seen = new Set();
  const accounts = [];
  let withoutTelegram = 0;

  for (const account of list) {
    const userId = parseTelegramUserId(account?.telegramInitData);

    if (userId === null) {
      withoutTelegram += 1;
      continue;
    }

    const key = String(userId);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    accounts.push({
      partition: account.partition,
      title: account.title || key,
      userId,
      tags: Array.isArray(account.tags) ? account.tags : [],
    });
  }

  if (!accounts.length) {
    throw new Error(
      "None of these accounts have Telegram data, so none can be imported.",
    );
  }

  return {
    accounts,
    tags: extractTags(data, accounts),
    total: list.length,
    withoutTelegram,
  };
}

/**
 * Pairs the parsed accounts with the wallets this drop already holds.
 *
 * `existingId` is what the import keys off: set means the account is already
 * here and keeps its wallet, unset means one has to be generated. The rest of
 * the shape is what `AutoAccountsChooser` renders — `id` because it keys and
 * toggles on it, `address` so a matched row shows the wallet it will reuse and
 * a new row shows nothing.
 */
export function buildCandidates({ accounts = [], existing = [], version = 5 }) {
  return accounts.map((account) => {
    const match = existing.find(
      (item) => String(item.userId) === String(account.userId),
    );

    return {
      id: account.partition || String(account.userId),
      title: account.title,
      userId: account.userId,
      tags: account.tags,
      version: match?.version || version,
      address: match?.address,
      existingId: match?.id,
    };
  });
}

export function filterCandidates(
  candidates,
  { tag = "", hideExisting = false },
) {
  return candidates.filter((candidate) => {
    if (hideExisting && candidate.existingId) {
      return false;
    }

    return tag ? candidate.tags.includes(tag) : true;
  });
}
