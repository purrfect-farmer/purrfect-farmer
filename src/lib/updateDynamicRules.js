import rules from "@/extension/rule-resources";

import { getUserAgent } from "./utils";

export default async function updateDynamicRules() {
  const userAgent = await getUserAgent();

  const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
  const oldRuleIds = oldRules.map((rule) => rule.id);
  const newRules = [
    {
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            header: "sec-ch-ua",
            operation: "set",
            value:
              '"Android WebView";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          },
          {
            header: "sec-ch-ua-mobile",
            operation: "set",
            value: "?0",
          },
          {
            header: "sec-ch-ua-platform",
            operation: "set",
            value: '"Android"',
          },
          {
            header: "sec-ch-ua-arch",
            operation: "set",
            value: '""',
          },
          {
            header: "sec-ch-ua-arch-full-version",
            operation: "set",
            value: '""',
          },
          {
            header: "sec-ch-ua-platform-version",
            operation: "set",
            value: '""',
          },
          {
            header: "sec-ch-ua-full-version-list",
            operation: "set",
            value: "",
          },
          {
            header: "sec-ch-ua-bitness",
            operation: "set",
            value: '""',
          },
          {
            header: "sec-ch-ua-model",
            operation: "set",
            value: '""',
          },
        ],
        responseHeaders: [
          {
            header: "content-security-policy",
            operation: "remove",
          },
          {
            header: "x-frame-options",
            operation: "remove",
          },
        ],
      },
      condition: {
        urlFilter: "*",
      },
    },
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
    ...rules,
  ].map((item, index) => ({ ...item, id: index + 1 }));

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
