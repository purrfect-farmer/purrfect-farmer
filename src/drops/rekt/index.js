import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "rekt",
  title: "Rekt.me",
  icon,
  component: createLazyElement(() => import("./Rekt")),
  telegramLink: "https://t.me/rektme_bot/rektapp?startapp=UJ740H",
  tasks: {
    ["daily-check-in"]: true,
    ["farming"]: true,
    ["boost-farming"]: true,
    ["claim-referrals"]: true,
    ["quests"]: false,
    ["game"]: false,
  },
};
