import { createLazyElement } from "@/lib/utils";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "hrum",
  title: "Hrum",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./Hrum")),
  telegramLink: "http://t.me/hrummebot/game?startapp=ref1147265290",
  tasks: {
    ["daily.check-in"]: true,
    ["tasks"]: true,
    ["daily.riddle"]: true,
    ["daily.cookie"]: true,
  },
};
