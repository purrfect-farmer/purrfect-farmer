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
