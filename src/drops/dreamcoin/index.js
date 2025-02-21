import { createLazyElement } from "@/lib/utils";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "dreamcoin",
  title: "DreamCoin",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./DreamCoin")),
  telegramLink: "https://t.me/DreamCoinOfficial_bot?start=1147265290",
  tasks: {
    ["daily-reward"]: true,
    ["open-free-case"]: true,
    ["collect-clicker-reward"]: true,
    ["rewards"]: true,
    ["lottery"]: false,
    ["upgrade-all-level"]: false,
  },
};
