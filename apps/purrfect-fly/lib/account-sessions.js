import GramClient from "./telegram/GramClient.js";
import utils from "./utils.js";
import { logDevError } from "./dev-log.js";

/** Accounts worked on at the same time */
const BATCH_SIZE = 20;

/** Connect attempts per account */
const MAX_ATTEMPTS = 3;

/** Destroy a client so the next attempt starts cold */
async function resetClient(account, client) {
  client = client || GramClient.instances.get(account.session);

  try {
    await client?.destroy?.();
  } catch {
    /** Ignore */
  }

  GramClient.delete(account.session);
}

/** Run work with a connected client, retrying with a fresh client on failure */
export async function withAccountSession(
  account,
  work,
  { attempts = MAX_ATTEMPTS, onFailure } = {},
) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    let client;

    try {
      client = await GramClient.create(account.session);
      await client.connect();

      return { success: true, result: await work(client, account) };
    } catch (error) {
      logDevError(
        `Account session failed (attempt ${attempt}/${attempts}):`,
        error,
      );

      await resetClient(account, client);

      if (attempt < attempts) {
        await utils.delayForSeconds(attempt * 5);
        continue;
      }

      await onFailure?.(account, error);

      return { success: false, error };
    }
  }
}

/** Run work for every account in staggered batches, calling onResult as each one settles */
export async function forEachAccountSession(
  accounts,
  work,
  { onResult, ...options } = {},
) {
  const results = new Map();

  for (const chunk of utils.chunkArrayGenerator(accounts, BATCH_SIZE)) {
    await Promise.allSettled(
      chunk.map(async (account, index) => {
        await utils.delayForSeconds(index * 2);

        const outcome = await withAccountSession(account, work, options);

        results.set(account, outcome);
        onResult?.(account, outcome);
      }),
    );
  }

  return results;
}
