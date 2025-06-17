const app = {
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

  drops: [
    {
      id: "string-drive",
      enabled: process.env.FARMER_STRING_DRIVE_ENABLED !== "false",
      threadId: process.env.FARMER_STRING_DRIVE_THREAD_ID ?? "",
      telegramLink:
        process.env.FARMER_STRING_DRIVE_LINK ??
        "https://t.me/stringdrive_bot/startapp?startapp=1147265290",
    },
    {
      id: "dragonz-land",
      enabled: process.env.FARMER_DRAGONZ_LAND_ENABLED !== "false",
      threadId: process.env.FARMER_DRAGONZ_LAND_THREAD_ID ?? "",
      telegramLink:
        process.env.FARMER_DRAGONZ_LAND_LINK ??
        "https://t.me/dragonz_land_bot/app?startapp=ref-6850578f6a48d249772e2f35",
    },
    {
      id: "digger",
      enabled: process.env.FARMER_DIGGER_ENABLED !== "false",
      threadId: process.env.FARMER_DIGGER_THREAD_ID ?? "",
      telegramLink:
        process.env.FARMER_DIGGER_LINK ??
        "https://t.me/diggerton_bot/dig?startapp=bro1147265290",
    },
    {
      id: "frogster",
      enabled: process.env.FARMER_FROGSTER_ENABLED !== "false",
      threadId: process.env.FARMER_FROGSTER_THREAD_ID ?? "",
      telegramLink:
        process.env.FARMER_FROGSTER_LINK ??
        "https://t.me/FrogstersBot?startapp=775f1cc48a46ce",
      interval: "0 * * * *",
    },
    {
      id: "meta-lott",
      enabled: process.env.FARMER_META_LOTT_ENABLED !== "false",
      threadId: process.env.FARMER_META_LOTT_THREAD_ID ?? "",
      telegramLink:
        process.env.FARMER_META_LOTT_LINK ??
        "https://t.me/meta_lott_bot?start=51835690",
      interval: "0 * * * *",
    },
    {
      id: "battle-bulls",
      enabled: process.env.FARMER_BATTLE_BULLS_ENABLED !== "false",
      threadId: process.env.FARMER_BATTLE_BULLS_THREAD_ID ?? "",
      telegramLink:
        process.env.FARMER_BATTLE_BULLS_LINK ??
        "https://t.me/battle_games_com_bot/start?startapp=frndId1147265290",
    },
    {
      id: "gold-eagle",
      enabled: process.env.FARMER_GOLD_EAGLE_ENABLED !== "false",
      threadId: process.env.FARMER_GOLD_EAGLE_THREAD_ID ?? "",
      telegramLink:
        process.env.FARMER_GOLD_EAGLE_LINK ??
        "https://t.me/gold_eagle_coin_bot/main?startapp=r_ubdOBYN6KX",
    },
    {
      id: "hrum",
      enabled: process.env.FARMER_HRUM_ENABLED !== "false",
      threadId: process.env.FARMER_HRUM_THREAD_ID ?? "",
      telegramLink:
        process.env.FARMER_HRUM_LINK ??
        "https://t.me/hrummebot/game?startapp=ref1147265290",
      interval: "*/30 * * * *",
    },
    {
      id: "tsubasa",
      enabled: process.env.FARMER_TSUBASA_ENABLED !== "false",
      threadId: process.env.FARMER_TSUBASA_THREAD_ID ?? "",
      telegramLink:
        process.env.FARMER_TSUBASA_LINK ??
        "https://t.me/TsubasaRivalsBot/start?startapp=inviter_id-1147265290",
      options: {
        upgradeCards: process.env.FARMER_TSUBASA_UPGRADE_CARDS !== "false",
      },
      interval: "*/30 * * * *",
    },
    {
      id: "matchquest",
      enabled: process.env.FARMER_MATCHQUEST_ENABLED !== "false",
      threadId: process.env.FARMER_MATCHQUEST_THREAD_ID ?? "",
      telegramLink:
        process.env.FARMER_MATCHQUEST_LINK ??
        "https://t.me/MatchQuestBot/start?startapp=775f1cc48a46ce5221f1d9476233dc33",
    },
    {
      id: "space-adventure",
      enabled: process.env.FARMER_SPACE_ADVENTURE_ENABLED !== "false",
      threadId: process.env.FARMER_SPACE_ADVENTURE_THREAD_ID ?? "",
      telegramLink:
        process.env.FARMER_SPACE_ADVENTURE_LINK ??
        "https://t.me/spaceadv_game_bot/play?startapp=1147265290",
      options: {
        watchAds: process.env.FARMER_SPACE_ADVENTURE_WATCH_ADS === "true",
      },
      interval: "*/4 * * * *",
    },
    {
      id: "wonton",
      enabled: process.env.FARMER_WONTON_ENABLED !== "false",
      threadId: process.env.FARMER_WONTON_THREAD_ID ?? "",
      telegramLink:
        process.env.FARMER_WONTON_LINK ??
        "https://t.me/WontonOrgBot/gameapp?startapp=referralCode=K45JQRG7",
      interval: "*/30 * * * *",
    },
    {
      id: "funatic",
      enabled: process.env.FARMER_FUNATIC_ENABLED !== "false",
      threadId: process.env.FARMER_FUNATIC_THREAD_ID ?? "",
      telegramLink:
        process.env.FARMER_FUNATIC_LINK ??
        "https://t.me/LuckyFunaticBot/lucky_funatic?startapp=1147265290",
    },
    {
      id: "slotcoin",
      enabled: process.env.FARMER_SLOTCOIN_ENABLED !== "false",
      threadId: process.env.FARMER_SLOTCOIN_THREAD_ID ?? "",
      telegramLink:
        process.env.FARMER_SLOTCOIN_LINK ??
        "https://t.me/SlotCoinApp_bot/app?startapp=eyJyZWZfY29kZSI6ImEyZGQtNjBmNyIsInV0bV9pZCI6InJlZmZlcmFsX2xpbmtfc2hhcmUifQ==",
    },
    {
      id: "dreamcoin",
      enabled: process.env.FARMER_DREAMCOIN_ENABLED !== "false",
      threadId: process.env.FARMER_DREAMCOIN_THREAD_ID ?? "",
      telegramLink:
        process.env.FARMER_DREAMCOIN_LINK ??
        "https://t.me/DreamCoinOfficial_bot?start=1147265290",
    },
  ],
};

module.exports = app;
