import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "matchquest",
  title: "MatchQuest",
  icon,
  component: createLazyElement(() => import("./MatchQuest")),
  telegramLink:
    "https://t.me/MatchQuestBot/start?startapp=775f1cc48a46ce5221f1d9476233dc33",
  tasks: {
    ["farming"]: true,
    ["tasks"]: true,
    ["daily-task-purchase"]: true,
    ["game"]: true,
  },
};
