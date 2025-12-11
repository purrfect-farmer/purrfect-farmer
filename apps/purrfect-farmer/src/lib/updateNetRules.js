import { getNetRules } from "@/extension/rule-resources";

import { customLogger, getUserAgent, storeUserAgent } from "../utils";

export default async function updateNetRules() {
  const userAgent = await getUserAgent();
  const newRules = getNetRules(userAgent).map((item, index) => ({
    ...item,
    id: index + 1,
  }));

  if (import.meta.env.VITE_WHISKER) {
    await window.electron.ipcRenderer.invoke(
      "update-declarative-net-rules",
      newRules
    );
  }

  if (typeof chrome?.declarativeNetRequest === "undefined") {
    return;
  }

  const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
  const oldRuleIds = oldRules.map((rule) => rule.id);

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
