import { createLazyElement } from "@/lib/utils";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "tsubasa",
  title: "Tsubasa",
  icon,
  component: createLazyElement(() => import("./Tsubasa")),
  telegramLink:
    "https://t.me/TsubasaRivalsBot/start?startapp=inviter_id-1147265290",
  tasks: {
    ["daily-reward"]: true,
    ["tasks"]: false,
    ["cards"]: false,
  },
};
