import { createTelegramClient } from "./createTelegramClient";
import {
  acceptLoginToken,
  finalizeLoginToken,
  requestLoginToken,
} from "@purrfect/shared/utils/loginToken.js";

/** Mint a brand new authorization that an already-authorized client approves
 * @param {import("./TelegramWebClient").default} authorizingClient
 * @param {object} options
 * @param {(attempt: number) => Promise<string|null>} [options.getPassword] - the next 2FA password
 * @returns {Promise<import("./TelegramWebClient").default>} the newly authorized client, the caller destroys it
 */
export async function mintTelegramClient(authorizingClient, { getPassword }) {
  const client = createTelegramClient();

  try {
    /** Connect Without Authenticating */
    await client.connect();

    /** Export Login Token */
    const exported = await requestLoginToken(client);

    /** Accept the Token on the Already-Authorized Client */
    await acceptLoginToken(authorizingClient, exported.token);

    /** Collect the Authorization, handling DC migration and 2FA */
    await finalizeLoginToken(client, { getPassword });

    return client;
  } catch (error) {
    await client.destroy().catch(() => {});
    throw error;
  }
}
