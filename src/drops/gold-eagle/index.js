import { createLazyElement } from "@/lib/utils";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "gold-eagle",
  title: "Gold Eagle",
  icon,
  component: createLazyElement(() => import("./GoldEagle")),
  telegramLink: "https://t.me/gold_eagle_coin_bot/main?startapp=r_ubdOBYN6KX",
  tasks: {
    ["game"]: true,
  },
};
