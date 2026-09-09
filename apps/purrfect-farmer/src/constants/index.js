export const LEGACY_PURRFECT_GRAM_URL = "https://gram.purrfectfarmer.com";

export const TELEGRAM_WEB_URLS = [
  "https://web.telegram.org",
  LEGACY_PURRFECT_GRAM_URL,
  import.meta.env.VITE_APP_TELEGRAM_WEB_URL,
];
export const WEB_PLATFORM_REGEXP = /tgWebAppPlatform=(webk|weba|web)/;
export const WEB_PLATFORM_EXCLUDED_HOSTS = [
  "game.genkiminer.xyz",
  "game.mars2049.online",
  "walletbot.me",
];
