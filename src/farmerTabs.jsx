import AppIcon from "@/assets/images/icon.png?format=webp&w=80";
import TelegramWebAIcon from "@/assets/images/telegram-web-a.png?format=webp&w=80";
import TelegramWebKIcon from "@/assets/images/telegram-web-k.png?format=webp&w=80";
import path from "path-browserify";
import { lazy } from "react";

import Farmer from "./Farmer";

export const Welcome = lazy(() => import("@/Welcome"));
export const TelegramWeb = lazy(() => import("@/TelegramWeb"));

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

const farmerTabs = [
  {
    id: "app",
    title: import.meta.env.VITE_APP_NAME,
    icon: AppIcon,
    component: <Welcome />,
  },
  {
    id: "telegram-web-k",
    title: "Telegram WebK",
    icon: TelegramWebKIcon,
    component: <TelegramWeb version="k" />,
  },
  {
    id: "telegram-web-a",
    title: "Telegram WebA",
    icon: TelegramWebAIcon,
    component: <TelegramWeb version="a" />,
  },
  {
    id: "funatic",
    title: "Funatic",
    icon: farmerIcons["funatic"],
    component: <Farmer farmer="Funatic" />,
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
    component: <Farmer farmer="GoldEagle" id="gold-eagle" />,
    telegramLink: "https://t.me/gold_eagle_coin_bot/main?startapp=r_ubdOBYN6KX",
    tasks: {
      ["game"]: true,
    },
  },
  {
    id: "midas",
    title: "Midas",
    icon: farmerIcons["midas"],
    component: <Farmer farmer="Midas" />,
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
    component: <Farmer farmer="Zoo" />,
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
    component: <Farmer farmer="Hrum" />,
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
    component: <Farmer farmer="Tsubasa" />,
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
    component: <Farmer farmer="Rekt" />,
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
    component: <Farmer farmer="DreamCoin" />,
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
    component: <Farmer id={"battle-bulls"} farmer={"BattleBulls"} />,
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
    component: <Farmer farmer="Blum" />,
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
    component: <Farmer farmer="Yescoin" />,
    telegramLink: "https://t.me/theYescoin_bot/Yescoin?startapp=bH7bto",
    tasks: {
      ["daily-check-in"]: true,
      ["claim-special-box"]: false,
      ["tasks"]: false,
      ["missions"]: false,
      ["game"]: false,
      ["claim-task-bonus"]: false,
    },
  },
  {
    id: "wonton",
    title: "Wonton",
    icon: farmerIcons["wonton"],
    component: <Farmer farmer="Wonton" />,
    telegramLink:
      "https://t.me/WontonOrgBot/gameapp?startapp=referralCode=K45JQRG7",
    tasks: {
      ["daily-check-in"]: true,
      ["farming"]: true,
      ["use-top-shop-item"]: false,
      ["tasks"]: false,
      ["badges"]: false,
      ["game"]: false,
    },
  },
  {
    id: "notgram",
    title: "Notgram",
    icon: farmerIcons["notgram"],
    component: <Farmer farmer="Notgram" />,
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
    component: <Farmer farmer="Slotcoin" />,
    telegramLink:
      "https://t.me/SlotCoinApp_bot/app?startapp=eyJyZWZfY29kZSI6ImEyZGQtNjBmNyIsInV0bV9pZCI6InJlZmZlcmFsX2xpbmtfc2hhcmUifQ==",
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
    component: <Farmer farmer="BirdTon" />,
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
    component: <Farmer farmer="MatchQuest" />,
    telegramLink:
      "https://t.me/MatchQuestBot/start?startapp=775f1cc48a46ce5221f1d9476233dc33",
    tasks: {
      ["farming"]: true,
      ["tasks"]: true,
      ["daily-task-purchase"]: true,
      ["game"]: false,
    },
  },
  {
    id: "truecoin",
    title: "Truecoin",
    icon: farmerIcons["truecoin"],
    component: <Farmer farmer="Truecoin" />,
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
    component: <Farmer farmer="Pumpad" />,
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
    component: <Farmer farmer="Agent301" />,
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
    component: <Farmer farmer="Tomarket" />,
    telegramLink: "https://t.me/Tomarket_ai_bot/app?startapp=00003s0r",
    tasks: {
      ["farming"]: true,
      ["tickets"]: false,
      ["game"]: false,
    },
  },
];

export default farmerTabs;
