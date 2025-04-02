import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "yescoin",
  title: "Yescoin",
  icon,
  component: createLazyElement(() => import("./Yescoin")),
  telegramLink: "https://t.me/theYescoin_bot/Yescoin?startapp=bH7bto",
  host: "www.yescoin.fun",
  domains: ["*.yescoin.fun"],
  authHeaders: ["token"],
  tasks: {
    ["daily-check-in"]: true,
    ["claim-special-box"]: true,
    ["tasks"]: false,
    ["missions"]: true,
    ["claim-task-bonus"]: true,
  },
};
