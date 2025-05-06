import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "unijump",
  title: "Unijump",
  icon,
  component: createLazyElement(() => import("./Unijump")),
  telegramLink: "https://t.me/unijump_bot/game?startapp=ref5859194569569580966",
  host: "unijump.xyz",
  netRequest: {
    origin: "https://unijump.xyz",
    domains: ["unijump.xyz"],
  },
  apiOptions: {
    withCredentials: true,
  },
  syncToCloud: true,
  embedWebPage: true,
  embedInNewWindow: true,

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .get(
        `https://unijump.xyz/api/v1/auth/login?${new URLSearchParams({
          initData: telegramWebApp.initData,
        }).toString()}`
      )
      .then((res) => res.data);
  },
  tasks: {
    ["daily-reward"]: true,
    ["claim-leagues"]: true,
    ["farming"]: true,
    ["lootbox"]: true,
  },
});
