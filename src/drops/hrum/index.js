import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "hrum",
  title: "Hrum",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./Hrum")),
  telegramLink: "https://t.me/hrummebot/game?startapp=ref1147265290",
  host: "game.hrum.me",
  domains: ["*.hrum.me"],
  extractAuthHeaders(headers) {
    return headers.filter(
      (header) =>
        header.name.toLowerCase() === "api-key" && header.value !== "empty"
    );
  },
  tasks: {
    ["daily.check-in"]: true,
    ["tasks"]: true,
    ["daily.riddle"]: true,
    ["daily.cookie"]: true,
  },
};
