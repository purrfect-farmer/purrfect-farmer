import { createLazyElement } from "@/lib/createLazyElement";
import { customLogger } from "@/lib/utils";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";
import { getTomarketGame } from "./lib/utils";

export default {
  id: "tomarket",
  title: "Tomarket",
  icon,
  component: createLazyElement(() => import("./Tomarket")),
  telegramLink: "https://t.me/Tomarket_ai_bot/app?startapp=00003s0r",

  host: "mini-app.tomarket.ai",
  domains: ["*.tomarket.ai"],
  apiDelay: 500,

  /** Fetch Meta */
  async fetchMeta() {
    const game = await getTomarketGame();

    /** Log it */
    customLogger("TOMARKET", game);

    /** Throw Error */
    if (!game) {
      throw new Error("Unable to setup Tomarket");
    }

    return game;
  },

  tasks: {
    ["farming"]: true,
    ["tickets"]: false,
    ["game"]: false,
  },
};
