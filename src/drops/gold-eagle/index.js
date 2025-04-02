import { createLazyElement } from "@/lib/createLazyElement";
import { customLogger } from "@/lib/utils";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";
import { getGoldEagleGame } from "./lib/utils";

export default {
  id: "gold-eagle",
  title: "Gold Eagle",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./GoldEagle")),
  telegramLink: "https://t.me/gold_eagle_coin_bot/main?startapp=r_ubdOBYN6KX",
  host: "telegram.geagle.online",
  domains: ["gold-eagle-api.fly.dev"],
  async fetchMeta() {
    const game = await getGoldEagleGame();

    /** Log it */
    customLogger("GOLD-EAGLE", game);

    /** Throw Error */
    if (!game) {
      throw new Error("Unable to setup Gold Eagle");
    }

    return game;
  },
  tasks: {
    ["game"]: true,
  },
};
