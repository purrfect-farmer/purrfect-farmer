import { createLazyElement } from "@/lib/createLazyElement";
import { delayForSeconds } from "@/lib/utils";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "notgram",
  title: "Notgram",
  icon,
  component: createLazyElement(() => import("./Notgram")),
  telegramLink: "https://t.me/notgram_game_bot?start=r1147265290",
  host: "notgramgame.fun",
  usesPort: true,
  embedWebPage: true,
  cacheAuth: false,

  /** Fetch Auth */
  fetchAuth() {
    return delayForSeconds(10, true).then(() =>
      Promise.resolve({ status: true })
    );
  },
  tasks: {
    ["tasks"]: false,
  },
  closeBotInZoomies: false,
};
