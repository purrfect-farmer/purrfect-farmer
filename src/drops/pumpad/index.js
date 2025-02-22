import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "pumpad",
  title: "Pumpad",
  icon,
  component: createLazyElement(() => import("./Pumpad")),
  telegramLink: "https://t.me/Pumpad_Bot/Lucky?startapp=52458255372295027",
  tasks: {
    ["daily-check-in"]: true,
    ["points"]: false,
    ["missions"]: false,
    ["tickets"]: false,
    ["lottery"]: false,
  },
};
