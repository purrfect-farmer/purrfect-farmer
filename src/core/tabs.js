import AppIcon from "@/assets/images/icon.png?format=webp&w=80";
import CloudManagerIcon from "@/assets/images/cloud-manager.png?format=webp&w=80";
import CloudTelegramSessionIcon from "@/assets/images/cloud-telegram-session.png?format=webp&w=80";
import LocalTelegramSessionIcon from "@/assets/images/local-telegram-session.png?format=webp&w=80";
import TelegramWebAIcon from "@/assets/images/telegram-web-a.png?format=webp&w=80";
import TelegramWebKIcon from "@/assets/images/telegram-web-k.png?format=webp&w=80";
import { createElement } from "react";
import { lazy } from "react";

import farmers from "./farmers";

export const Welcome = lazy(() => import("@/app/Welcome"));
export const TelegramWeb = lazy(() => import("@/app/TelegramWeb"));
export const CloudManager = lazy(() => import("@/app/CloudManager"));
export const CloudTelegramSession = lazy(() =>
  import("@/app/CloudTelegramSession")
);
export const LocalTelegramSession = lazy(() =>
  import("@/app/LocalTelegramSession")
);

export const app = [
  /** App */
  {
    id: "app",
    title: import.meta.env.VITE_APP_NAME,
    icon: AppIcon,
    component: createElement(Welcome),
  },
];

export const telegramWeb = [
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
];

export const utils = [
  /** Cloud Telegram Session */
  {
    id: "cloud-manager",
    title: "Cloud Manager",
    icon: CloudManagerIcon,
    component: createElement(CloudManager),
  },

  /** Cloud Telegram Session */
  {
    id: "cloud-telegram-session",
    title: "Cloud Telegram Session",
    icon: CloudTelegramSessionIcon,
    component: createElement(CloudTelegramSession),
  },

  /** Local Telegram Session */
  {
    id: "local-telegram-session",
    title: "Local Telegram Session",
    icon: LocalTelegramSessionIcon,
    component: createElement(LocalTelegramSession),
  },
];

export { farmers };
export default [...app, ...telegramWeb, ...utils, ...farmers];
