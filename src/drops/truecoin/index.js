import { createLazyElement } from "@/lib/utils";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "truecoin",
  title: "Truecoin",
  icon,
  component: createLazyElement(() => import("./Truecoin")),
  telegramLink: "https://t.me/true_coin_bot?start=1147265290",
  tasks: {
    ["daily-check-in"]: true,
    ["tasks"]: false,
    ["lottery.claim-all-50-boost"]: true,
    ["lottery"]: false,
  },
};
