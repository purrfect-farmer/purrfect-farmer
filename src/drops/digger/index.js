import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "digger",
  title: "Digger",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./Digger")),
  telegramLink: "https://t.me/diggerton_bot/dig?startapp=bro1147265290",
  host: "diggergame.app",
  domains: ["*.diggergame.app"],
  tasks: {
    ["dig"]: true,
    ["tasks"]: false,
    ["chests"]: false,
    ["game"]: false,
    ["cards"]: false,
  },
};
