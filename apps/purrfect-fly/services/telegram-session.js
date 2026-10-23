import GramClient from "../lib/GramClient.js";
import crypto from "node:crypto";
import { logDevError } from "../lib/dev-log.js";

/** A new random session name */
export function createSessionId() {
  return crypto.randomBytes(8).toString("hex");
}

/** Log a session out of Telegram, logging failures in development only */
export async function logoutSession(session) {
  try {
    const client = await GramClient.create(session);

    await client.connect();
    await client.logout();
  } catch (error) {
    logDevError("Error logging out account:", error);
  }
}
