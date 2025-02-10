import { createLazyElement } from "@/lib/utils";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "tomarket",
  title: "Tomarket",
  icon,
  component: createLazyElement(() => import("./Tomarket")),
  telegramLink: "https://t.me/Tomarket_ai_bot/app?startapp=00003s0r",
  tasks: {
    ["farming"]: true,
    ["tickets"]: false,
    ["game"]: false,
  },
};
