import { createLazyElement } from "@/lib/utils";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "horse-go",
  title: "HorseGo",
  icon,
  component: createLazyElement(() => import("./HorseGo")),
  telegramLink: "https://t.me/HorseGo_bot/HorseFever?startapp=code_G6ZAC6",
  tasks: {
    ["daily-sign-in"]: true,
    ["complete-tasks"]: true,
    ["game"]: false,
  },
};
