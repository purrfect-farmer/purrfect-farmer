const rules = [
  {
    origin: "https://game.genkiminer.xyz",
    domains: ["game.genkiminer.xyz"],
  },
  {
    origin: "https://static.agent301.org",
    domains: ["agent301.org"],
  },
  {
    origin: "https://birdton.site",
    domains: ["birdton.site"],
  },
  {
    origin: "https://telegram.blum.codes",
    domains: ["blum.codes"],
  },
  {
    origin: "https://web.app.ton.tsubasa-rivals.com",
    domains: ["app.ton.tsubasa-rivals.com"],
  },
  {
    origin: "https://game.hrum.me",
    domains: ["hrum.me"],
  },
  {
    origin: "https://tg-home.pumpad.io",
    domains: ["pumpad.io"],
  },
  {
    origin: "https://app.slotcoin.app",
    domains: ["slotcoin.app"],
  },
  {
    origin: "https://mini-app.tomarket.ai",
    domains: ["tomarket.ai"],
  },
  {
    origin: "https://bot.true.world",
    domains: ["true.world"],
  },
  {
    origin: "https://www.yescoin.fun",
    domains: ["yescoin.fun"],
  },
  {
    origin: "https://www.wonton.restaurant",
    domains: ["wonton.restaurant"],
  },
  {
    origin: "https://tgapp.matchain.io",
    domains: ["tgapp-api.matchain.io"],
  },
  {
    origin: "https://dreamcoin.ai",
    domains: ["dreamcoin.ai"],
  },
  {
    origin: "https://rekt-mini-app.vercel.app",
    domains: ["rekt-mini-app.vercel.app"],
  },
  {
    origin: "https://tg.battle-games.com",
    domains: ["battle-games.com"],
  },
  {
    origin: "https://prod-tg-app.midas.app",
    domains: ["midas.app"],
  },
  {
    origin: "https://clicker.funtico.com",
    domains: ["funtico.com"],
  },
  {
    origin: "https://app.cexptap.com",
    domains: ["app.cexptap.com"],
  },
  {
    origin: "https://horsego.vip",
    domains: ["horsego.vip"],
  },
  {
    origin: "https://telegram.geagle.online",
    domains: ["telegram.geagle.online", "gold-eagle-api.fly.dev"],
  },
  {
    origin: "https://diggergame.app",
    domains: ["api.diggergame.app"],
  },
  {
    origin: "https://clicker.funtico.com",
    domains: ["*.funtico.com"],
  },
  {
    origin: "https://space-adventure.online",
    domains: ["space-adventure.online"],
    requestHeaders: [
      {
        header: "origins",
        operation: "set",
        value: "https://space-adventure.online",
      },
    ],
  },
].map((item) => ({
  action: {
    type: "modifyHeaders",
    responseHeaders: [
      ...(item.responseHeaders || []),
      {
        header: "access-control-allow-origin",
        operation: "set",
        value: "*",
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
  },
}));

export default rules;
