import { Api } from "telegram";
import { computeCheck } from "telegram/Password.js";

/** Telegram API credentials (must match BaseTelegramWebClient) */
export const TELEGRAM_API_ID = 2496;
export const TELEGRAM_API_HASH = "8da85b0d5bfe62527e5b244c209159c3";

/** How many times to re-export while waiting for the token to be accepted */
const FINALIZE_ATTEMPTS = 5;

/**
 * Export a login token.
 *
 * Returns the raw result, which may be a `LoginToken` (not yet accepted), a
 * `LoginTokenSuccess` (accepted) or a `LoginTokenMigrateTo` (accepted, but the
 * authorization lives on another DC).
 *
 * @param {import("telegram").TelegramClient} client
 */
export function exportLoginToken(client) {
  return client.invoke(
    new Api.auth.ExportLoginToken({
      apiId: TELEGRAM_API_ID,
      apiHash: TELEGRAM_API_HASH,
      exceptIds: [],
    }),
  );
}

/**
 * Export a fresh login token, asserting the client is still unauthorized.
 *
 * @param {import("telegram").TelegramClient} client
 * @returns {Promise<Api.auth.LoginToken>}
 */
export async function requestLoginToken(client) {
  const result = await exportLoginToken(client);

  if (!(result instanceof Api.auth.LoginToken)) {
    throw new Error(`Unexpected export result: ${result.className}`);
  }

  return result;
}

/**
 * Accept a login token using an already-authorized client.
 *
 * This is the server-side equivalent of scanning the QR code.
 *
 * @param {import("telegram").TelegramClient} authorizedClient
 * @param {Buffer} token
 */
export function acceptLoginToken(authorizedClient, token) {
  return authorizedClient.invoke(new Api.auth.AcceptLoginToken({ token }));
}

/**
 * Re-export the login token to collect the authorization.
 *
 * Handles acceptance not having propagated yet, DC migration and 2FA.
 *
 * @param {import("telegram").TelegramClient} client
 * @param {object} options
 * @param {(attempt: number) => Promise<string|null>} [options.getPassword]
 *   Resolves the next 2FA password candidate, or `null` when exhausted.
 */
export async function finalizeLoginToken(client, { getPassword } = {}) {
  return _finalize(client, getPassword, 0);
}

/** Finalize, retrying while the acceptance propagates */
async function _finalize(client, getPassword, attempt) {
  let result;

  try {
    result = await exportLoginToken(client);
  } catch (error) {
    if (error.errorMessage === "SESSION_PASSWORD_NEEDED") {
      return checkPassword(client, getPassword);
    }
    throw error;
  }

  if (result instanceof Api.auth.LoginTokenSuccess) {
    return result.authorization;
  }

  /** Acceptance not yet propagated — retry a few times */
  if (result instanceof Api.auth.LoginToken) {
    if (attempt >= FINALIZE_ATTEMPTS) {
      throw new Error("Login token was not accepted in time");
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return _finalize(client, getPassword, attempt + 1);
  }

  if (result instanceof Api.auth.LoginTokenMigrateTo) {
    await client._switchDC(result.dcId);

    try {
      const migrated = await client.invoke(
        new Api.auth.ImportLoginToken({ token: result.token }),
      );

      if (migrated instanceof Api.auth.LoginTokenSuccess) {
        return migrated.authorization;
      }

      throw new Error(`Unexpected migrate result: ${migrated.className}`);
    } catch (error) {
      if (error.errorMessage === "SESSION_PASSWORD_NEEDED") {
        return checkPassword(client, getPassword);
      }
      throw error;
    }
  }

  throw new Error(`Unexpected login token result: ${result.className}`);
}

/** Complete 2FA by trying each password the resolver hands back */
export async function checkPassword(client, getPassword) {
  if (!getPassword) {
    throw new Error("2FA password required but none provided");
  }

  let lastError;

  for (let attempt = 0; ; attempt++) {
    const password = await getPassword(attempt);

    /** Candidates exhausted */
    if (password === null || password === undefined) {
      if (attempt === 0) {
        throw new Error("2FA password required but none provided");
      }

      throw new Error(
        `2FA failed: no provided password matched${
          lastError ? ` (${lastError.errorMessage || lastError.message})` : ""
        }`,
      );
    }

    try {
      const passwordSrp = await client.invoke(new Api.account.GetPassword());
      const check = await computeCheck(passwordSrp, password);

      return await client.invoke(new Api.auth.CheckPassword({ password: check }));
    } catch (error) {
      lastError = error;

      /** Wrong password — try the next candidate */
      if (error.errorMessage === "PASSWORD_HASH_INVALID") {
        continue;
      }

      throw error;
    }
  }
}
