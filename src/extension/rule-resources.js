import farmers from "@/core/farmers";

const rules = farmers
  .map((item) => item.netRequest)
  .filter(Boolean)
  .concat([
    {
      origin: "https://game.genkiminer.xyz",
      domains: ["game.genkiminer.xyz"],
    },
  ])
  .map((item) => ({
    action: {
      type: "modifyHeaders",
      responseHeaders: item.responseHeaders,
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
    },
  }));

export default rules;
