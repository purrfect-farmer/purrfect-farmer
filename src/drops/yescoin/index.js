import { createLazyElement } from "@/lib/utils";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "yescoin",
  title: "Yescoin",
  icon,
  component: createLazyElement(() => import("./Yescoin")),
  telegramLink: "https://t.me/theYescoin_bot/Yescoin?startapp=bH7bto",
  tasks: {
    ["daily-check-in"]: true,
    ["claim-special-box"]: true,
    ["daily"]: true,
    ["achievement"]: false,
    ["partner"]: false,
  },
};
