import AppIcon from "@/assets/images/icon.png?format=webp&w=80";
import TelegramWebAIcon from "@/assets/images/telegram-web-a.png?format=webp&w=80";
import TelegramWebKIcon from "@/assets/images/telegram-web-k.png?format=webp&w=80";
import { createElement } from "react";
import { lazy } from "react";

import farmers from "./farmers";

export const Welcome = lazy(() => import("@/app/Welcome"));
export const TelegramWeb = lazy(() => import("@/app/TelegramWeb"));

const tabs = [
  /** App */
  {
    id: "app",
    title: import.meta.env.VITE_APP_NAME,
    icon: AppIcon,
    component: createElement(Welcome),
  },

  /** Telegram-Web */
  {
    id: "telegram-web-k",
    title: "Telegram WebK",
    icon: TelegramWebKIcon,
    component: createElement(TelegramWeb, { version: "k" }),
  },
  {
    id: "telegram-web-a",
    title: "Telegram WebA",
    icon: TelegramWebAIcon,
    component: createElement(TelegramWeb, { version: "a" }),
  },

  /** Farmers */
  ...farmers,
];

export default tabs;
