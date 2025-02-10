import { createLazyElement } from "@/lib/utils";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "blum",
  title: "Blum",
  icon,
  component: createLazyElement(() => import("./Blum")),
  telegramLink: "https://t.me/blum/app?startapp=ref_3AIqvLlFFK",
  tasks: {
    ["daily-check-in"]: true,
    ["friends-reward"]: true,
    ["farming"]: true,
    ["tasks"]: false,
    ["game"]: false,
  },
};
