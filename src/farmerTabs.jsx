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
    id: "notgram",
    title: "Notgram",
    icon: farmerIcons["notgram"],
    component: <Farmer farmer="Notgram" />,
    telegramLink: "https://t.me/notgram_game_bot?start=r1147265290",
    miniAppUrl: "https://notgramgame.fun",
    shouldClickLaunchButton: true,
    tasks: ["tasks"],
  },
  {
    id: "notpixel",
    title: "Not Pixel",
    icon: farmerIcons["notpixel"],
    component: <Farmer farmer="NotPixel" />,
    telegramLink: "https://t.me/notpixel/app?startapp=f1147265290_s664035",
    tasks: ["paint"],
  },

  {
    id: "blum",
    title: "Blum",
    icon: farmerIcons["blum"],
    component: <Farmer farmer="Blum" />,
    telegramLink: "https://t.me/blum/app?startapp=ref_3AIqvLlFFK",
    tasks: ["tasks", "game"],
  },
  {
    id: "hrum",
    title: "Hrum",
    icon: farmerIcons["hrum"],
    component: <Farmer farmer="Hrum" />,
    telegramLink: "http://t.me/hrummebot/game?startapp=ref1147265290",
    tasks: ["tasks", "daily.riddle", "daily.cookie"],
  },
  {
    id: "yescoin",
    title: "Yescoin",
    icon: farmerIcons["yescoin"],
    component: <Farmer farmer="Yescoin" />,
    telegramLink: "https://t.me/theYescoin_bot/Yescoin?startapp=bH7bto",
    tasks: ["tasks", "missions", "game"],
  },
  {
    id: "wonton",
    title: "Wonton",
    icon: farmerIcons["wonton"],
    component: <Farmer farmer="Wonton" />,
    telegramLink:
      "https://t.me/WontonOrgBot/gameapp?startapp=referralCode=K45JQRG7",
    tasks: ["tasks", "game"],
  },
  {
    id: "tomarket",
    title: "Tomarket",
    icon: farmerIcons["tomarket"],
    component: <Farmer farmer="Tomarket" />,
    telegramLink: "https://t.me/Tomarket_ai_bot/app?startapp=00003s0r",
    tasks: ["game"],
  },
  {
    id: "pumpad",
    title: "Pumpad",
    icon: farmerIcons["pumpad"],
    component: <Farmer farmer="Pumpad" />,
    telegramLink: "https://t.me/Pumpad_Bot/Lucky?startapp=52458255372295027",
    tasks: ["missions", "tickets", "lottery"],
  },
  {
    id: "slotcoin",
    title: "Slotcoin",
    icon: farmerIcons["slotcoin"],
    component: <Farmer farmer="Slotcoin" />,
    telegramLink:
      "https://t.me/SlotCoinApp_bot/app?startapp=eyJyZWZfY29kZSI6ImEyZGQtNjBmNyIsInV0bV9pZCI6InJlZmZlcmFsX2xpbmtfc2hhcmUifQ==",
    tasks: ["quests", "tickets", "lottery"],
  },
  {
    id: "agent301",
    title: "Agent 301",
    icon: farmerIcons["agent301"],
    component: <Farmer farmer="Agent301" />,
    telegramLink: "https://t.me/Agent301Bot/app?startapp=onetime1147265290",
    tasks: ["tasks", "wheel.puzzle", "wheel", "tickets"],
  },

  {
    id: "goats",
    title: "Goats",
    icon: farmerIcons["goats"],
    component: <Farmer farmer="Goats" />,
    telegramLink:
      "https://t.me/realgoats_bot/run?startapp=f0a65866-9ab8-4f40-af15-7dcd196d3af7",
    tasks: ["missions"],
  },
  {
    id: "truecoin",
    title: "Truecoin",
    icon: farmerIcons["truecoin"],
    component: <Farmer farmer="Truecoin" />,
    telegramLink: "https://t.me/true_coin_bot?start=1147265290",
    miniAppUrl: "https://bot.true.world",
    shouldClickLaunchButton: true,
    tasks: ["tasks", "lottery.50-boost", "lottery"],
  },
  {
    id: "birdton",
    title: "BirdTON",
    icon: farmerIcons["birdton"],
    component: <Farmer farmer="BirdTon" />,
    telegramLink: "https://t.me/BIRDTonBot/app?startapp=1147265290",
    tasks: ["game", "tasks"],
  },
];

export default farmerTabs;
