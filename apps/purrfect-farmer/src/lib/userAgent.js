import {
  getUserAgent,
  randomUserAgent,
  sendWebviewMessage,
  storeUserAgent,
} from "@/utils";

import updateNetRules from "./updateNetRules";

/** Store a user agent and apply it to the net rules */
export async function setUserAgent(userAgent) {
  await storeUserAgent(userAgent);
  await updateNetRules();
}

/** Replace the user agent with a random one from the catalog */
export function regenerateUserAgent() {
  return setUserAgent(randomUserAgent());
}

/** The Whisker account's user agent, once Whisker has sent its data */
const whisker = { isKnown: false, userAgent: null };

/** Whisker syncs, run one after another so the latest one wins */
let whiskerSyncQueue = Promise.resolve();

/**
 * Apply the Whisker account's user agent, or send the current one
 * to Whisker when the account has none.
 */
async function applyWhiskerUserAgent(whiskerUserAgent) {
  const userAgent = await getUserAgent();

  if (!whiskerUserAgent) {
    sendWebviewMessage({ action: "set-user-agent", data: { userAgent } });
  } else if (whiskerUserAgent !== userAgent) {
    await setUserAgent(whiskerUserAgent);
  }
}

/** Apply the last user agent Whisker sent again, after something replaced the stored one */
export function resyncWhiskerUserAgent() {
  if (!whisker.isKnown) return whiskerSyncQueue;

  whiskerSyncQueue = whiskerSyncQueue
    .then(() => applyWhiskerUserAgent(whisker.userAgent))
    .catch((error) => {
      console.error("Failed to sync the Whisker User-Agent:", error);
    });

  return whiskerSyncQueue;
}

/** Remember the Whisker account's user agent and apply it */
export function syncWhiskerUserAgent(whiskerUserAgent) {
  whisker.isKnown = true;
  whisker.userAgent = whiskerUserAgent || null;

  return resyncWhiskerUserAgent();
}
