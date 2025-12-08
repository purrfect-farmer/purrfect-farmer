import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  envPath: path.resolve(__dirname, "../.env"),
  name: env("APP_NAME", ""),
  farmer: {
    botId: env("FARMER_BOT_ID", 7592929753),
    botToken: env("FARMER_BOT_TOKEN", ""),
    botLink: env(
      "FARMER_BOT_LINK",
      "https://t.me/purrfect_little_bot/app?startapp=purrfect"
    ),
    channelLink: env("FARMER_CHANNEL_LINK", "https://t.me/purrfect_community"),
    groupLink: env("FARMER_GROUP_LINK", "https://t.me/purrfect_community_chat"),
  },

  /** Telegram Public Key*/
  telegramPublicKey: env(
    "TELEGRAM_PUBLIC_KEY",
    "e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d"
  ),

  chat: {
    id: env("TELEGRAM_CHAT_ID", ""),
    threads: {
      announcement: env("TELEGRAM_ANNOUNCEMENT_THREAD_ID", ""),
      error: env("TELEGRAM_ERROR_THREAD_ID", ""),
    },
  },

  /** Cron */
  cron: {
    enabled: env("CRON_ENABLED", true),
    mode: env("CRON_MODE", "sequential"),
  },

  /** Startup */
  startup: {
    sendServerAddress: env("STARTUP_SEND_SERVER_ADDRESS", true),
  },

  displayAccountTitle: env("DISPLAY_ACCOUNT_TITLE", false),
  disableTelegramMessages: env("DISABLE_TELEGRAM_MESSAGES", false),

  proxy: {
    enabled: env("PROXY_ENABLED", false),
    apiKey: env("PROXY_API_KEY", ""),
    page: env("PROXY_PAGE", 1),
    pageSize: env("PROXY_PAGE_SIZE", 100),
  },

  seeker: {
    enabled: env("SEEKER_ENABLED", false),
    server: env("SEEKER_SERVER", ""),
    key: env("SEEKER_KEY", ""),
  },
};
