import { AuthKey } from "telegram/crypto/AuthKey";
import { MemorySession } from "telegram/sessions";
import { TelegramClient } from "telegram";
import {
  TELEGRAM_API_HASH,
  TELEGRAM_API_ID,
} from "@purrfect/shared/utils/loginToken.js";

/** Create a connected Client from a Telegram Web account entry, or null when unauthorized */
export async function getTelegramClientFromSession(details) {
  /* Create Session and Client */
  const session = new MemorySession();
  const client = new TelegramClient(
    session,
    TELEGRAM_API_ID,
    TELEGRAM_API_HASH,
    {
      appVersion: "2.2 K",
      systemLangCode: "en-US",
      langCode: "en",
      deviceModel: navigator.userAgent,
      systemVersion: navigator.platform,
      useWSS: true,
    },
  );

  /* Get DC Info */
  const dcInfo = await client.getDC(details.dcId);
  console.log("DC Info:", dcInfo);

  /* Set Auth Key */
  const authKeyHex = details[`dc${dcInfo.id}_auth_key`];
  const authKey = new AuthKey();
  authKey.setKey(Buffer.from(authKeyHex, "hex"));

  /* Set Session Details */
  session.setDC(dcInfo.id, dcInfo.ipAddress, dcInfo.port);
  session.setAuthKey(authKey, dcInfo.id);

  /* Connect Client */
  await client.connect();

  /* Check Authorization */
  const isAuthorized = await client.isUserAuthorized();
  console.log("Is Client Authorized?", isAuthorized);

  if (isAuthorized) {
    return client;
  } else {
    await client.destroy();
    return null;
  }
}

/** Build the per-slot account object Telegram Web keeps in localStorage */
export function buildTelegramWebAccount({ authKey, dcId, userId }) {
  return {
    dcId,
    [`dc${dcId}_auth_key`]: authKey,

    /** Web-K resolves the session through dc2, whatever the real DC is */
    dc2_auth_key: authKey,

    userId: userId.toString(),
    auth_key_fingerprint: authKey.slice(0, 8),
  };
}

/** Highest occupied account slot, read off the keys rather than the stored counter */
function getHighestAccountSlot(storage) {
  return Object.keys(storage).reduce((highest, key) => {
    const slotMatch = key.match(/^account(\d+)$/);

    return slotMatch ? Math.max(highest, Number(slotMatch[1])) : highest;
  }, 0);
}

/** Place an account into its slot, leaving every other slot signed in */
export function mergeTelegramWebAccount(storage, slotIndex, account) {
  const merged = {
    ...storage,
    [`account${slotIndex}`]: JSON.stringify(account),
  };

  /** Web-K only enumerates slots 1..number_of_accounts */
  merged["number_of_accounts"] = String(getHighestAccountSlot(merged));

  return merged;
}
