export default {
  name: process.env.APP_NAME,
  farmer: {
    botId: process.env.FARMER_BOT_ID ?? "7592929753",
    botToken: process.env.FARMER_BOT_TOKEN ?? "",
    botLink:
      process.env.FARMER_BOT_LINK ??
      "https://t.me/purrfect_little_bot/app?startapp=purrfect",
    channelLink:
      process.env.FARMER_CHANNEL_LINK ?? "https://t.me/purrfect_community",
    groupLink:
      process.env.FARMER_GROUP_LINK ?? "https://t.me/purrfect_community_chat",
  },

  /** Telegram Public Key*/
  telegramPublicKey:
    process.env.TELEGRAM_PUBLIC_KEY ??
    "e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d",

  chat: {
    id: process.env.TELEGRAM_CHAT_ID ?? "",
    threads: {
      announcement: process.env.TELEGRAM_ANNOUNCEMENT_THREAD_ID ?? "",
      error: process.env.TELEGRAM_ERROR_THREAD_ID ?? "",
    },
  },

  /** Cron */
  cron: {
    enabled: process.env.CRON_ENABLED !== "false",
    mode: process.env.CRON_MODE ?? "sequential",
  },

  /** Startup */
  startup: {
    sendServerAddress: process.env.STARTUP_SEND_SERVER_ADDRESS !== "false",
  },

  displayAccountTitle: process.env.DISPLAY_ACCOUNT_TITLE === "true",
  disableTelegramMessages: process.env.DISABLE_TELEGRAM_MESSAGES === "true",

  proxy: {
    enabled: process.env.PROXY_ENABLED === "true",
    apiKey: process.env.PROXY_API_KEY ?? "",
    page: process.env.PROXY_PAGE ?? 1,
    pageSize: process.env.PROXY_PAGE_SIZE ?? 100,
  },

  seeker: {
    enabled: process.env.SEEKER_ENABLED === "true",
    server: process.env.SEEKER_SERVER ?? "",
    key: process.env.SEEKER_KEY ?? "",
  },
};
