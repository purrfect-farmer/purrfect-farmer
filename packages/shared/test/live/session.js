import { Logger } from "telegram";

import BaseTelegramWebClient from "../../lib/BaseTelegramWebClient.js";

/** The live test account's string session, or null when none is set */
export function getTestSession() {
  return process.env.TELEGRAM_TEST_SESSION || null;
}

/** Skip reason for live tests when no session is set */
export const skipWithoutSession =
  !getTestSession() && "no TELEGRAM_TEST_SESSION";

/** A client logged in as the live test account; the caller destroys it */
export function createTestClient() {
  return new BaseTelegramWebClient(getTestSession(), {
    baseLogger: new Logger("error"),
  });
}
