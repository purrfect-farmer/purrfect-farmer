import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "birdton",
  title: "BirdTON",
  icon,
  component: createLazyElement(() => import("./BirdTon")),
  telegramLink: "https://t.me/BIRDTonBot/app?startapp=1147265290",
  tasks: {
    ["daily-check-in"]: true,
    ["game"]: false,
    ["tasks"]: false,
  },
};
