import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "birdton",
  title: "BirdTON",
  icon,
  component: createLazyElement(() => import("./BirdTon")),
  telegramLink: "https://t.me/BIRDTonBot/app?startapp=1147265290",
  host: "birdton.site",
  netRequest: {
    origin: "https://birdton.site",
    domains: ["birdton.site"],
  },
  embedWebPage: true,
  cacheAuth: false,

  /** Start Manually */
  startManually: true,

  /** Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post("https://birdton.site/auth", telegramWebApp)
      .then((res) => res.data);
  },
  tasks: {
    ["daily-check-in"]: true,
    ["game"]: false,
    ["tasks"]: false,
  },
});
