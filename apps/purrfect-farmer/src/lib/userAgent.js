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

/**
 * Apply the Whisker account's user agent, or send the current one
 * to Whisker when the account has none.
 */
export async function syncWhiskerUserAgent(whiskerUserAgent) {
  const userAgent = await getUserAgent();

  if (!whiskerUserAgent) {
    sendWebviewMessage({ action: "set-user-agent", data: { userAgent } });
  } else if (whiskerUserAgent !== userAgent) {
    await setUserAgent(whiskerUserAgent);
  }
}
