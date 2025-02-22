import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "notgram",
  title: "Notgram",
  icon,
  component: createLazyElement(() => import("./Notgram")),
  telegramLink: "https://t.me/notgram_game_bot?start=r1147265290",
  tasks: {
    ["tasks"]: false,
  },
  closeBotInZoomies: false,
};
