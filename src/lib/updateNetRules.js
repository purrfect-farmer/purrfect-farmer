import { getNetRules } from "@/extension/rule-resources";

import { customLogger, getUserAgent, storeUserAgent } from "./utils";

export default async function updateNetRules() {
  if (typeof chrome?.declarativeNetRequest === "undefined") {
    return;
  }

  const userAgent = await getUserAgent();

  const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
  const oldRuleIds = oldRules.map((rule) => rule.id);
  const newRules = getNetRules(userAgent).map((item, index) => ({
    ...item,
    id: index + 1,
  }));

  /** Log */
  customLogger("DECLARATIVE NET RULES", newRules);

  /** Update Rules */
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: oldRuleIds,
    addRules: newRules,
  });

  /** Store User-Agent */
  await storeUserAgent(userAgent);
}
