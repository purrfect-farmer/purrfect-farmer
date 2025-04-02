import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "dreamcoin",
  title: "DreamCoin",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./DreamCoin")),
  telegramLink: "https://t.me/DreamCoinOfficial_bot?start=1147265290",
  host: "dreamcoin.ai",
  authHeaders: ["authorization", "baggage", "sentry-trace"],
  domains: ["*.dreamcoin.ai"],
  tasks: {
    ["daily-reward"]: true,
    ["open-free-case"]: true,
    ["collect-clicker-reward"]: true,
    ["rewards"]: true,
    ["lottery"]: false,
    ["upgrade-all-level"]: false,
  },
};
