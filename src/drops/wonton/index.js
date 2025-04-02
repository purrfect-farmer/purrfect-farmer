import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "wonton",
  title: "Wonton",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./Wonton")),
  telegramLink:
    "https://t.me/WontonOrgBot/gameapp?startapp=referralCode=K45JQRG7",
  host: "www.wonton.restaurant",
  domains: ["*.wonton.food"],
  apiDelay: 3000,
  tasks: {
    ["daily-check-in"]: true,
    ["farming"]: true,
    ["use-top-shop-item"]: false,
    ["tasks"]: false,
    ["badges"]: false,
    ["game"]: false,
    ["draw-basic-box"]: true,
  },
};
