import { Logger } from "telegram";

import BaseTelegramWebClient from "../../lib/BaseTelegramWebClient.js";
import { getDcDetails, getTelegramDcManager } from "../../utils/dc.js";

/** The live test account's string session, or null when none is set */
export function getTestSession() {
  return process.env.TELEGRAM_TEST_SESSION || null;
}

/** Skip reason for live tests when no session is set */
export const skipWithoutSession =
  !getTestSession() && "no TELEGRAM_TEST_SESSION";

/** A client logged in as the live test account; close it with closeTestClient */
export async function createTestClient() {
  const client = new BaseTelegramWebClient(getTestSession(), {
    baseLogger: new Logger("error"),
  });

  /** A browser-minted session saves a WebSocket host, so use the DC's own address */
  const info = await getDcDetails(client.session.dcId);
  client.session.setDC(info.id, info.ipAddress, info.port);

  return client;
}

/** Destroy the test client and the DC lookup client */
export async function closeTestClient(client) {
  await client?.destroy();
  await getTelegramDcManager().dcClient?.destroy();
}
