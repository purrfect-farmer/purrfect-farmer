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

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post("https://api-web.tomarket.ai/tomarket-game/v1/user/login", {
        ["init_data"]: telegramWebApp.initData,
        ["invite_code"]: "00003s0r",
        ["from"]: "",
        ["is_bot"]: false,
      })
      .then((res) => res.data.data);
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["Authorization"] = data["access_token"];
  },

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
