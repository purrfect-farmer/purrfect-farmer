/** Reading Purrfect Whiskers backups as a list of Telegram accounts, ignoring the session blobs they carry */

import { requestWebviewMessage } from "@/utils";

/** The Telegram user id inside a Mini App `initData` query string, dropped rather than guessed when malformed */
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

/** The account list out of either file shape, a full backup or a selected export */
function extractAccounts(data) {
  if (Array.isArray(data?.app?.accounts)) {
    return data.app.accounts;
  }

  if (Array.isArray(data?.accounts)) {
    return data.accounts.map((item) => item?.account || item);
  }

  return null;
}

/** Tag names only exist in a full backup, so a selected export labels a tag by its id */
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

  /** The same Telegram account can occupy two partitions, so only the first is offered */
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

/** Pairs the parsed accounts with the wallets this drop already holds, keyed by `existingId` */
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

/** Error text per host failure code, so the toast says something useful */
const LAUNCH_ERRORS = {
  ACCOUNT_NOT_FOUND: "No Whiskers account with that Telegram user id.",
  INVALID_REQUEST: "No Telegram user id to launch.",
};

/** Ask Purrfect Whiskers to launch the account matching this Telegram user id */
export async function launchWhiskersAccount(telegramUserId) {
  const result = await requestWebviewMessage("launch-account", {
    telegramUserId,
  });

  if (!result?.success) {
    throw new Error(
      LAUNCH_ERRORS[result?.error] || "Could not launch the account.",
    );
  }

  return result;
}
