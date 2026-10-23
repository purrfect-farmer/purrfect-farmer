import {
  acceptLoginToken,
  finalizeLoginToken,
  requestLoginToken,
} from "@purrfect/shared/utils/loginToken.js";

import { getDcDetails } from "@purrfect/shared/utils/dc.js";

/**
 * Mint a brand-new, independent session from an existing authorized session
 * using the Telegram login-token (QR) flow. The imported session authorizes
 * the token so no phone/code is required; when the account has 2FA enabled,
 * each candidate password is tried until one succeeds.
 *
 * @param {typeof import("./GramClient.js").default} GramClient
 * @param {string} sessionString - StringSession of an authorized account
 * @param {object} options
 * @param {string[]} [options.passwords] - Candidate 2FA passwords to try
 * @param {string|null} [options.proxy]
 * @returns {Promise<{ session: string, user: import("telegram").Api.User }>}
 */
export async function cloneSession(
  GramClient,
  sessionString,
  { passwords = [], proxy = null } = {},
) {
  const source = GramClient.createRaw(sessionString, proxy);
  const fresh = GramClient.createRaw("", proxy);

  try {
    /** A whiskers session's DC address may be unreachable, so use the one resolved here */
    const dcId = source.session.dcId;
    if (dcId) {
      const info = await getDcDetails(dcId);
      source.session.setDC(info.id, info.ipAddress, info.port);
    }

    await source.connect();
    await fresh.connect();

    /** The imported session must be authorized to accept the token */
    if (!(await source.isUserAuthorized())) {
      throw new Error("Source session is not authorized");
    }

    /** Export a login token from the fresh (empty) client */
    const exported = await requestLoginToken(fresh);

    /** Accept the token using the authorized client (server-side QR scan) */
    await acceptLoginToken(source, exported.token);

    /** Finalize: obtain authorization (handling DC migration and 2FA) */
    await finalizeLoginToken(fresh, {
      getPassword: (attempt) => passwords[attempt] ?? null,
    });

    const user = await fresh.getMe();
    const session = fresh.session.save();

    return { session, user };
  } finally {
    await source.destroy().catch(() => {});
    await fresh.destroy().catch(() => {});
  }
}
