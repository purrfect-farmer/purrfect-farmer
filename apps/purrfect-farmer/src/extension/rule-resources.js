import farmers from "@/core/farmers";
import { getSecChUa } from "@purrfect/shared/lib/userAgent/clientHints";
import { isExtension } from "@/utils";

/** The net rules, giving farmer domains and opened mini-app hosts the phone's headers */
export function getNetRules(userAgent, miniAppHosts = []) {
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
    [],
  );

  const phoneDomains = [...new Set([...farmerDomains, ...miniAppHosts])];

  /** The headers a phone's Telegram WebView sends */
  const phoneHeaders = [
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
      value: getSecChUa(userAgent),
    },
    {
      header: "sec-ch-ua-mobile",
      operation: "set",
      value: "?1",
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
  ];

  /**
   * @type {chrome.declarativeNetRequest.Rule[]}
   */
  const rules = [
    {
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            header: "sec-fetch-mode",
            operation: "set",
            value: '""',
          },
        ],
      },
      condition: {
        requestDomains: ["ipwho.is"],
      },
    },
    {
      action: { type: "modifyHeaders", requestHeaders: phoneHeaders },
      condition: { requestDomains: phoneDomains },
    },
  ];

  /** Requests a mini-app makes to its API, ad and captcha hosts carry the phone's headers too */
  if (miniAppHosts.length > 0) {
    rules.push({
      action: { type: "modifyHeaders", requestHeaders: phoneHeaders },
      condition: { initiatorDomains: miniAppHosts },
    });
  }

  return rules.concat(
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
      }),
    ),
  );
}
