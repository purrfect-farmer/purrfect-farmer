import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "midas",
  title: "Midas",
  icon,
  component: createLazyElement(() => import("./Midas")),
  telegramLink:
    "https://t.me/MidasRWA_bot/app?startapp=ref_746a3d4f-5108-4931-af18-5589b9a07af9",
  host: "prod-tg-app.midas.app",
  domains: ["api-tg-app.midas.app"],
  apiDelay: 3000,
  apiOptions: {
    withCredentials: true,
  },
  tasks: {
    ["visit"]: true,
    ["daily-check-in"]: true,
    ["claim-referral-rewards"]: true,
    ["tasks"]: false,
    ["game"]: false,
  },
};
