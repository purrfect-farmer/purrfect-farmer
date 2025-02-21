import { createLazyElement } from "@/lib/utils";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "slotcoin",
  title: "Slotcoin",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./Slotcoin")),
  telegramLink:
    "https://t.me/SlotCoinApp_bot/app?startapp=eyJyZWZfY29kZSI6ImEyZGQtNjBmNyIsInV0bV9pZCI6InJlZmZlcmFsX2xpbmtfc2hhcmUifQ==",
  tasks: {
    ["daily-check-in"]: true,
    ["quests"]: false,
    ["tickets"]: false,
    ["lottery"]: false,
  },
};
