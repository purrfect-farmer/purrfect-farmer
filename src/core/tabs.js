import AppIcon from "@/assets/images/icon.png?format=webp&w=80";
import Farmer from "@/components/Farmer";
import TelegramWebAIcon from "@/assets/images/telegram-web-a.png?format=webp&w=80";
import TelegramWebKIcon from "@/assets/images/telegram-web-k.png?format=webp&w=80";
import path from "path-browserify";
import { createElement } from "react";
import { kebabCase } from "change-case";
import { lazy } from "react";

/** Create Farmer Component */
const createFarmerComponent = (farmer, kebab = false) =>
  createElement(Farmer, {
    id: kebab ? kebabCase(farmer) : farmer.toLowerCase(),
    farmer,
  });

export const Welcome = lazy(() => import("@/app/Welcome"));
export const TelegramWeb = lazy(() => import("@/app/TelegramWeb"));

export const farmerIconsGlob = import.meta.glob(
  "@/drops/*/assets/images/icon.png",
  {
    eager: true,
    import: "default",
    query: {
      format: "webp",
      w: "80",
      h: "80",
    },
  }
);
export const farmerIcons = Object.fromEntries(
  Object.entries(farmerIconsGlob).map(([k, v]) => {
    return [path.basename(k.replace("/assets/images/icon.png", "")), v];
  })
);

const tabs = [
  {
    id: "app",
    title: import.meta.env.VITE_APP_NAME,
    icon: AppIcon,
    component: createElement(Welcome),
  },
  {
    id: "telegram-web-k",
    title: "Telegram WebK",
    icon: TelegramWebKIcon,
    component: createElement(TelegramWeb, { version: "k" }),
  },
  {
    id: "telegram-web-a",
    title: "Telegram WebA",
    icon: TelegramWebAIcon,
    component: createElement(TelegramWeb, { version: "a" }),
  },
  {
    id: "cex",
    title: "CEX",
    icon: farmerIcons["cex"],
    component: createFarmerComponent("CEX"),
    telegramLink: "https://t.me/cexio_tap_bot?start=1717159919141996",
    tasks: {
      ["tasks"]: false,
      ["game"]: false,
      ["cards"]: false,
    },
  },
  {
    id: "horse-go",
    title: "HorseGo",
    icon: farmerIcons["horse-go"],
    component: createFarmerComponent("HorseGo", true),
    telegramLink: "https://t.me/HorseGo_bot/HorseFever?startapp=code_G6ZAC6",
    tasks: {
      ["daily-sign-in"]: true,
      ["complete-tasks"]: true,
      ["game"]: false,
    },
  },
  {
    id: "funatic",
    title: "Funatic",
    icon: farmerIcons["funatic"],
    component: createFarmerComponent("Funatic"),
    telegramLink:
      "https://t.me/LuckyFunaticBot/lucky_funatic?startapp=1147265290",
    tasks: {
      ["set-exchange"]: true,
      ["daily-bonus"]: true,
      ["boosters"]: false,
      ["quests"]: false,
      ["game"]: false,
      ["cards"]: false,
    },
  },
  {
    id: "gold-eagle",
    title: "Gold Eagle",
    icon: farmerIcons["gold-eagle"],
    component: createFarmerComponent("GoldEagle", true),
    telegramLink: "https://t.me/gold_eagle_coin_bot/main?startapp=r_ubdOBYN6KX",
    tasks: {
      ["game"]: true,
    },
  },
  {
    id: "midas",
    title: "Midas",
    icon: farmerIcons["midas"],
    component: createFarmerComponent("Midas"),
    telegramLink:
      "https://t.me/MidasRWA_bot/app?startapp=ref_746a3d4f-5108-4931-af18-5589b9a07af9",
    tasks: {
      ["visit"]: true,
      ["daily-check-in"]: true,
      ["claim-referral-rewards"]: true,
      ["tasks"]: false,
      ["game"]: false,
    },
  },
  {
    id: "zoo",
    title: "Zoo",
    icon: farmerIcons["zoo"],
    component: createFarmerComponent("Zoo"),
    telegramLink: "https://t.me/zoo_story_bot/game?startapp=ref1147265290",
    tasks: {
      ["daily-reward"]: true,
      ["claim-riddle-and-rebus"]: true,
      ["tasks"]: true,
      ["quizzes"]: true,
      ["feed"]: true,
      ["purchase-boost"]: true,
      ["animals"]: true,
    },
  },
  {
    id: "hrum",
    title: "Hrum",
    icon: farmerIcons["hrum"],
    component: createFarmerComponent("Hrum"),
    telegramLink: "http://t.me/hrummebot/game?startapp=ref1147265290",
    tasks: {
      ["daily.check-in"]: true,
      ["tasks"]: true,
      ["daily.riddle"]: true,
      ["daily.cookie"]: true,
    },
  },
  {
    id: "tsubasa",
    title: "Tsubasa",
    icon: farmerIcons["tsubasa"],
    component: createFarmerComponent("Tsubasa"),
    telegramLink:
      "https://t.me/TsubasaRivalsBot/start?startapp=inviter_id-1147265290",
    tasks: {
      ["daily-reward"]: true,
      ["tasks"]: false,
      ["cards"]: false,
    },
  },
  {
    id: "rekt",
    title: "Rekt.me",
    icon: farmerIcons["rekt"],
    component: createFarmerComponent("Rekt"),
    telegramLink: "https://t.me/rektme_bot/rektapp?startapp=UJ740H",
    tasks: {
      ["daily-check-in"]: true,
      ["farming"]: true,
      ["boost-farming"]: true,
      ["claim-referrals"]: true,
      ["quests"]: false,
      ["game"]: false,
    },
  },
  {
    id: "dreamcoin",
    title: "DreamCoin",
    icon: farmerIcons["dreamcoin"],
    component: createFarmerComponent("DreamCoin"),
    telegramLink: "https://t.me/DreamCoinOfficial_bot?start=1147265290",
    tasks: {
      ["daily-reward"]: true,
      ["open-free-case"]: true,
      ["collect-clicker-reward"]: true,
      ["rewards"]: true,
      ["lottery"]: false,
      ["upgrade-all-level"]: false,
    },
  },
  {
    id: "battle-bulls",
    title: "Battle Bulls",
    icon: farmerIcons["battle-bulls"],
    component: createFarmerComponent("BattleBulls", true),
    telegramLink:
      "https://t.me/battle_games_com_bot/start?startapp=frndId1147265290",
    tasks: {
      ["daily-reward"]: true,
      ["choose-blockchain"]: true,
      ["tasks"]: false,
      ["cards"]: false,
    },
  },
  {
    id: "blum",
    title: "Blum",
    icon: farmerIcons["blum"],
    component: createFarmerComponent("Blum"),
    telegramLink: "https://t.me/blum/app?startapp=ref_3AIqvLlFFK",
    tasks: {
      ["daily-check-in"]: true,
      ["friends-reward"]: true,
      ["farming"]: true,
      ["tasks"]: false,
      ["game"]: false,
    },
  },
  {
    id: "yescoin",
    title: "Yescoin",
    icon: farmerIcons["yescoin"],
    component: createFarmerComponent("Yescoin"),
    telegramLink: "https://t.me/theYescoin_bot/Yescoin?startapp=bH7bto",
    tasks: {
      ["daily-check-in"]: true,
      ["claim-special-box"]: true,
      ["tasks"]: false,
      ["missions"]: true,
      ["game"]: true,
      ["claim-task-bonus"]: true,
    },
  },
  {
    id: "wonton",
    title: "Wonton",
    icon: farmerIcons["wonton"],
    component: createFarmerComponent("Wonton"),
    telegramLink:
      "https://t.me/WontonOrgBot/gameapp?startapp=referralCode=K45JQRG7",
    tasks: {
      ["daily-check-in"]: true,
      ["farming"]: true,
      ["use-top-shop-item"]: false,
      ["tasks"]: false,
      ["badges"]: false,
      ["game"]: false,
      ["buy-basic-box"]: true,
      ["draw-basic-box"]: true,
    },
  },
  {
    id: "notgram",
    title: "Notgram",
    icon: farmerIcons["notgram"],
    component: createFarmerComponent("Notgram"),
    telegramLink: "https://t.me/notgram_game_bot?start=r1147265290",
    tasks: {
      ["tasks"]: false,
    },
    closeBotInZoomies: false,
  },
  {
    id: "slotcoin",
    title: "Slotcoin",
    icon: farmerIcons["slotcoin"],
    component: createFarmerComponent("Slotcoin"),
    telegramLink:
      "https://t.me/SlotCoinApp_bot/app?startapp=eyJyZWZfY29kZSI6ImEyZGQtNjBmNyIsInV0bV9pZCI6InJlZmZlcmFsX2xpbmtfc2hhcmUifQ=:",
    tasks: {
      ["daily-check-in"]: true,
      ["quests"]: false,
      ["tickets"]: false,
      ["lottery"]: false,
    },
  },
  {
    id: "birdton",
    title: "BirdTON",
    icon: farmerIcons["birdton"],
    component: createFarmerComponent("BirdTon"),
    telegramLink: "https://t.me/BIRDTonBot/app?startapp=1147265290",
    tasks: {
      ["daily-check-in"]: true,
      ["game"]: false,
      ["tasks"]: false,
    },
  },
  {
    id: "matchquest",
    title: "MatchQuest",
    icon: farmerIcons["matchquest"],
    component: createFarmerComponent("MatchQuest"),
    telegramLink:
      "https://t.me/MatchQuestBot/start?startapp=775f1cc48a46ce5221f1d9476233dc33",
    tasks: {
      ["farming"]: true,
      ["tasks"]: true,
      ["daily-task-purchase"]: true,
      ["game"]: true,
    },
  },
  {
    id: "truecoin",
    title: "Truecoin",
    icon: farmerIcons["truecoin"],
    component: createFarmerComponent("Truecoin"),
    telegramLink: "https://t.me/true_coin_bot?start=1147265290",
    tasks: {
      ["daily-check-in"]: true,
      ["tasks"]: false,
      ["lottery.claim-all-50-boost"]: true,
      ["lottery"]: false,
    },
  },
  {
    id: "pumpad",
    title: "Pumpad",
    icon: farmerIcons["pumpad"],
    component: createFarmerComponent("Pumpad"),
    telegramLink: "https://t.me/Pumpad_Bot/Lucky?startapp=52458255372295027",
    tasks: {
      ["daily-check-in"]: true,
      ["points"]: false,
      ["missions"]: false,
      ["tickets"]: false,
      ["lottery"]: false,
    },
  },
  {
    id: "agent301",
    title: "Agent 301",
    icon: farmerIcons["agent301"],
    component: createFarmerComponent("Agent301"),
    telegramLink: "https://t.me/Agent301Bot/app?startapp=onetime1147265290",
    tasks: {
      ["tasks"]: false,
      ["puzzle"]: false,
      ["wheel"]: false,
      ["tickets"]: false,
    },
  },
  {
    id: "tomarket",
    title: "Tomarket",
    icon: farmerIcons["tomarket"],
    component: createFarmerComponent("Tomarket"),
    telegramLink: "https://t.me/Tomarket_ai_bot/app?startapp=00003s0r",
    tasks: {
      ["farming"]: true,
      ["tickets"]: false,
      ["game"]: false,
    },
  },
];

export default tabs;
