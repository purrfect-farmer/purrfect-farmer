import farmers from "@/core/farmers";
import { isExtension } from "@/lib/utils";

export function getNetRules(userAgent) {
  const farmerNetRequests = farmers
    .map((item) => item.netRequest)
    .filter(Boolean)
    .concat([
      {
        origin: "https://game.genkiminer.xyz",
        domains: ["game.genkiminer.xyz"],
      },
    ]);

  const farmerDomains = farmerNetRequests.reduce(
    (result, item) => result.concat(item.domains),
    []
  );

  const rules = [
    {
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            header: "user-agent",
            operation: "set",
            value: userAgent,
          },
          {
            header: "x-requested-with",
            operation: "set",
            value: "org.telegram.messenger",
          },
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
          {
            header: "cross-origin-embedder-policy",
            operation: "remove",
          },
          {
            header: "cross-origin-opener-policy",
            operation: "remove",
          },
          {
            header: "cross-origin-resource-policy",
            operation: "remove",
          },
        ],
      },
      condition: {
        requestDomains: farmerDomains,
      },
    },
  ].concat(
    farmerNetRequests.map(
      /**
       * @returns {chrome.declarativeNetRequest.Rule}
       */
      (item) => ({
        action: {
          type: "modifyHeaders",
          responseHeaders: isExtension()
            ? item.responseHeaders
            : [
                ...(item.responseHeaders || []),
                {
                  header: "access-control-allow-origin",
                  operation: "set",
                  value: location.origin,
                },
                {
                  header: "access-control-allow-credentials",
                  operation: "set",
                  value: "true",
                },
                {
                  header: "access-control-allow-methods",
                  operation: "set",
                  value: "PUT, PATCH, DELETE",
                },
              ],
          requestHeaders: [
            ...(item.requestHeaders || []),
            {
              header: "origin",
              operation: "set",
              value: item.origin,
            },
            {
              header: "referer",
              operation: "set",
              value: item.origin + "/",
            },
          ],
        },
        condition: {
          requestDomains: item.domains,
          initiatorDomains:
            isExtension() === false ? [location.hostname] : undefined,
        },
      })
    )
  );

  return rules;
}
