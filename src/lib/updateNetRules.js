import rules from "@/extension/rule-resources";

import { getUserAgent } from "./utils";

export default async function updateNetRules() {
  const userAgent = await getUserAgent();

  const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
  const oldRuleIds = oldRules.map((rule) => rule.id);
  const newRules = [
    {
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            header: "user-agent",
            operation: "set",
            value: userAgent,
          },
        ],
      },
      condition: {
        urlFilter: "*",
      },
    },
  ]
    .concat(rules)
    .map((item, index) => ({ ...item, id: index + 1 }));

  /** Update Rules */
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: oldRuleIds,
    addRules: newRules,
  });

  /** Store User-Agent */
  await chrome.storage.local.set({
    userAgent,
  });
}
