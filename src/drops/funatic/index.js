import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "funatic",
  title: "Funatic",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./Funatic")),
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
};
