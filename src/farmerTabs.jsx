import AppIcon from "@/assets/images/icon.png?format=webp&w=80";
import TelegramWebAIcon from "@/assets/images/telegram-web-a.png?format=webp&w=80";
import TelegramWebKIcon from "@/assets/images/telegram-web-k.png?format=webp&w=80";
import path from "path-browserify";
import { lazy } from "react";

import Farmer from "./Farmer";

const Welcome = lazy(() => import("@/Welcome"));
const TelegramWeb = lazy(() => import("@/TelegramWeb"));

const farmerIconsGlob = import.meta.glob("@/drops/*/assets/images/icon.png", {
  eager: true,
  import: "default",
  query: {
    format: "webp",
    w: "80",
    h: "80",
  },
});
const farmerIcons = Object.fromEntries(
  Object.entries(farmerIconsGlob).map(([k, v]) => {
    return [path.basename(k.replace("/assets/images/icon.png", "")), v];
  })
);

const farmerTabs = [
  {
    id: "purrfect-farmer",
    title: "Purrfect Farmer",
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
    id: "notpixel",
    title: "Not Pixel",
    icon: farmerIcons["notpixel"],
    component: <Farmer farmer="NotPixel" />,
    telegramLink: "https://t.me/notpixel/app?startapp=f1147265290_s664035",
  },

  {
    id: "blum",
    title: "Blum",
    icon: farmerIcons["blum"],
    component: <Farmer farmer="Blum" />,
    telegramLink: "https://t.me/blum/app?startapp=ref_3AIqvLlFFK",
  },
  {
    id: "hrum",
    title: "Hrum",
    icon: farmerIcons["hrum"],
    component: <Farmer farmer="Hrum" />,
    telegramLink: "http://t.me/hrummebot/game?startapp=ref1147265290",
  },
  {
    id: "yescoin",
    title: "Yescoin",
    icon: farmerIcons["yescoin"],
    component: <Farmer farmer="Yescoin" />,
    telegramLink: "https://t.me/theYescoin_bot/Yescoin?startapp=bH7bto",
  },
  {
    id: "tada",
    title: "Tada",
    icon: farmerIcons["tada"],
    component: <Farmer farmer="Tada" />,
    telegramLink: "https://t.me/TADA_Ride_Bot/join?startapp=ref_lUIJ4eM-AV",
  },
  {
    id: "wonton",
    title: "Wonton",
    icon: farmerIcons["wonton"],
    component: <Farmer farmer="Wonton" />,
    telegramLink:
      "https://t.me/WontonOrgBot/gameapp?startapp=referralCode=K45JQRG7",
  },

  {
    id: "pumpad",
    title: "Pumpad",
    icon: farmerIcons["pumpad"],
    component: <Farmer farmer="Pumpad" />,
    telegramLink: "https://t.me/Pumpad_Bot/Lucky?startapp=52458255372295027",
  },
  {
    id: "slotcoin",
    title: "Slotcoin",
    icon: farmerIcons["slotcoin"],
    component: <Farmer farmer="Slotcoin" />,
    telegramLink:
      "https://t.me/SlotCoinApp_bot/app?startapp=eyJyZWZfY29kZSI6ImEyZGQtNjBmNyIsInV0bV9pZCI6InJlZmZlcmFsX2xpbmtfc2hhcmUifQ==",
  },
  {
    id: "agent301",
    title: "Agent 301",
    icon: farmerIcons["agent301"],
    component: <Farmer farmer="Agent301" />,
    telegramLink: "https://t.me/Agent301Bot/app?startapp=onetime1147265290",
  },

  {
    id: "goats",
    title: "Goats",
    icon: farmerIcons["goats"],
    component: <Farmer farmer="Goats" />,
    telegramLink:
      "https://t.me/realgoats_bot/run?startapp=f0a65866-9ab8-4f40-af15-7dcd196d3af7",
  },
  {
    id: "truecoin",
    title: "Truecoin",
    icon: farmerIcons["truecoin"],
    component: <Farmer farmer="Truecoin" />,
    telegramLink: "https://t.me/true_coin_bot?start=1147265290",
  },
  {
    id: "birdton",
    title: "BirdTON",
    icon: farmerIcons["birdton"],
    component: <Farmer farmer="BirdTon" />,
    telegramLink: "https://t.me/BIRDTonBot/app?startapp=1147265290",
  },
];

export default farmerTabs;
