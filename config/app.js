const app = {
  name: process.env.APP_NAME,
  farmerBotId: process.env.FARMER_BOT_ID ?? "7592929753",
  farmerBotToken: process.env.FARMER_BOT_TOKEN ?? "",
  farmerBotLink:
    process.env.FARMER_BOT_LINK ??
    "https://t.me/purrfect_little_bot/app?startapp=purrfect",
  farmerChannelLink:
    process.env.FARMER_CHANNEL_LINK ?? "https://t.me/purrfect_community",

  /** Telegram Public Key*/
  telegramPublicKey:
    process.env.TELEGRAM_PUBLIC_KEY ??
    "e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d",

  chatId: process.env.TELEGRAM_CHAT_ID ?? "",
  announcementThreadId: process.env.TELEGRAM_ANNOUNCEMENT_THREAD_ID ?? "",
  errorThreadId: process.env.TELEGRAM_ERROR_THREAD_ID ?? "",

  displayAccountTitle: process.env.DISPLAY_ACCOUNT_TITLE === "true",
  disableTelegramMessages: process.env.DISABLE_TELEGRAM_MESSAGES === "true",

  logApiCalls: process.env.LOG_API_CALLS === "true",

  payments: {
    enabled: process.env.PAYMENTS_ENABLED === "true",
    amount: process.env.PAYMENTS_AMOUNT ?? 1550,
  },

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
      id: "digger",
      title: "🏴‍☠️ Digger Farmer",
      enabled: process.env.FARMER_DIGGER_ENABLED !== "false",
      threadId: process.env.FARMER_DIGGER_THREAD_ID ?? "",
      telegramLink: "https://t.me/diggerton_bot/dig?startapp=bro1147265290",
    },
    {
      id: "frogster",
      title: "🐸 Frogster",
      enabled: process.env.FARMER_FROGSTER_ENABLED !== "false",
      threadId: process.env.FARMER_FROGSTER_THREAD_ID ?? "",
      telegramLink: "https://t.me/FrogstersBot?startapp=775f1cc48a46ce",
      interval: "0 * * * *",
    },
    {
      id: "meta-lott",
      title: "🕹️ Meta Lott Farmer",
      enabled: process.env.FARMER_META_LOTT_ENABLED !== "false",
      threadId: process.env.FARMER_META_LOTT_THREAD_ID ?? "",
      telegramLink: "https://t.me/meta_lott_bot?start=51835690",
      interval: "0 * * * *",
    },
    {
      id: "battle-bulls",
      title: "🐂 Battle Bulls Farmer",
      enabled: process.env.FARMER_BATTLE_BULLS_ENABLED !== "false",
      threadId: process.env.FARMER_BATTLE_BULLS_THREAD_ID ?? "",
      telegramLink:
        "https://t.me/battle_games_com_bot/start?startapp=frndId1147265290",
    },
    {
      id: "gold-eagle",
      title: "🥇 Gold Eagle Farmer",
      enabled: process.env.FARMER_GOLD_EAGLE_ENABLED !== "false",
      threadId: process.env.FARMER_GOLD_EAGLE_THREAD_ID ?? "",
      telegramLink:
        "https://t.me/gold_eagle_coin_bot/main?startapp=r_ubdOBYN6KX",
    },
    {
      id: "hrum",
      title: "🥠 Hrum Farmer",
      enabled: process.env.FARMER_HRUM_ENABLED !== "false",
      threadId: process.env.FARMER_HRUM_THREAD_ID ?? "",
      telegramLink: "https://t.me/hrummebot/game?startapp=ref1147265290",
      interval: "*/30 * * * *",
    },
    {
      id: "tsubasa",
      title: "⚽️ Tsubasa Farmer",
      enabled: process.env.FARMER_TSUBASA_ENABLED !== "false",
      threadId: process.env.FARMER_TSUBASA_THREAD_ID ?? "",
      telegramLink:
        "https://t.me/TsubasaRivalsBot/start?startapp=inviter_id-1147265290",
      interval: "*/30 * * * *",
      options: {
        upgradeCards: process.env.FARMER_TSUBASA_UPGRADE_CARDS !== "false",
      },
    },
    {
      id: "matchquest",
      title: "🌾 MatchQuest Farmer",
      enabled: process.env.FARMER_MATCHQUEST_ENABLED !== "false",
      threadId: process.env.FARMER_MATCHQUEST_THREAD_ID ?? "",
      telegramLink:
        "https://t.me/MatchQuestBot/start?startapp=775f1cc48a46ce5221f1d9476233dc33",
    },
    {
      id: "space-adventure",
      title: "🚀 Space Adventure Farmer",
      enabled: process.env.FARMER_SPACE_ADVENTURE_ENABLED !== "false",
      threadId: process.env.FARMER_SPACE_ADVENTURE_THREAD_ID ?? "",
      telegramLink: "https://t.me/spaceadv_game_bot/play?startapp=1147265290",
      interval: "*/4 * * * *",
    },
    {
      id: "wonton",
      title: "👨‍🍳 Wonton Farmer",
      enabled: process.env.FARMER_WONTON_ENABLED !== "false",
      threadId: process.env.FARMER_WONTON_THREAD_ID ?? "",
      telegramLink:
        "https://t.me/WontonOrgBot/gameapp?startapp=referralCode=K45JQRG7",
      interval: "*/30 * * * *",
    },
    {
      id: "funatic",
      title: "🤡 Funatic Farmer",
      enabled: process.env.FARMER_FUNATIC_ENABLED !== "false",
      threadId: process.env.FARMER_FUNATIC_THREAD_ID ?? "",
      telegramLink:
        "https://t.me/LuckyFunaticBot/lucky_funatic?startapp=1147265290",
    },
    {
      id: "slotcoin",
      title: "🎰 Slotcoin Farmer",
      enabled: process.env.FARMER_SLOTCOIN_ENABLED !== "false",
      threadId: process.env.FARMER_SLOTCOIN_THREAD_ID ?? "",
      telegramLink:
        "https://t.me/SlotCoinApp_bot/app?startapp=eyJyZWZfY29kZSI6ImEyZGQtNjBmNyIsInV0bV9pZCI6InJlZmZlcmFsX2xpbmtfc2hhcmUifQ==",
    },
    {
      id: "dreamcoin",
      title: "🔋 DreamCoin Farmer",
      enabled: process.env.FARMER_DREAMCOIN_ENABLED !== "false",
      threadId: process.env.FARMER_DREAMCOIN_THREAD_ID ?? "",
      telegramLink: "https://t.me/DreamCoinOfficial_bot?start=1147265290",
    },
  ],
};

module.exports = app;
