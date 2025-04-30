import farmers from "@/core/farmers";
import { isExtension } from "@/lib/utils";

const rules = farmers
  .map((item) => item.netRequest)
  .filter(Boolean)
  .concat([
    {
      origin: "https://game.genkiminer.xyz",
      domains: ["game.genkiminer.xyz"],
    },
  ])
  .map(
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
                header: "access-control-allow-methods",
                operation: "set",
                value: "*",
              },
            ],
        requestHeaders: [
          ...(item.requestHeaders || []),
          {
            header: "x-requested-with",
            operation: "set",
            value: "org.telegram.messenger",
          },
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
  );

export default rules;
