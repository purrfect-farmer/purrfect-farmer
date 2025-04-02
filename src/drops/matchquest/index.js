import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "matchquest",
  title: "MatchQuest",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./MatchQuest")),
  telegramLink:
    "https://t.me/MatchQuestBot/start?startapp=775f1cc48a46ce5221f1d9476233dc33",
  host: "tgapp.matchain.io",
  domains: ["tgapp-api.matchain.io"],
  tasks: {
    ["farming"]: true,
    ["tasks"]: true,
    ["daily-task-purchase"]: true,
    ["game"]: true,
  },
};
