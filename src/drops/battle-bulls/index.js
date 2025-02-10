import { createLazyElement } from "@/lib/utils";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "battle-bulls",
  title: "Battle Bulls",
  icon,
  component: createLazyElement(() => import("./BattleBulls")),
  telegramLink:
    "https://t.me/battle_games_com_bot/start?startapp=frndId1147265290",
  tasks: {
    ["daily-reward"]: true,
    ["choose-blockchain"]: true,
    ["tasks"]: false,
    ["cards"]: false,
  },
};
