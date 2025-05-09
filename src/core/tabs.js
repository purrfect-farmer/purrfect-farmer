import AppIcon from "@/assets/images/icon.png?format=webp&w=80";
import CloudIcon from "@/assets/images/cloud.png?format=webp&w=80";
import CloudTelegramSessionIcon from "@/assets/images/cloud-telegram-session.png?format=webp&w=80";
import LocalTelegramSessionIcon from "@/assets/images/local-telegram-session.png?format=webp&w=80";
import TelegramWebAIcon from "@/assets/images/telegram-web-a.png?format=webp&w=80";
import TelegramWebKIcon from "@/assets/images/telegram-web-k.png?format=webp&w=80";
import { createElement } from "react";
import { lazy } from "react";

import farmers from "./farmers";

export const Welcome = lazy(() => import("@/app/Welcome"));
export const Browser = lazy(() => import("@/app/Browser"));
export const TelegramWeb = lazy(() => import("@/app/TelegramWeb"));
export const Migrate = lazy(() => import("@/app/Migrate"));
export const PayForCloud = lazy(() => import("@/app/PayForCloud"));
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
  /** Pay For Cloud */
  {
    id: "pay-for-cloud",
    title: "Pay For Cloud",
    icon: CloudIcon,
    component: createElement(PayForCloud),
  },

  /** Cloud Manager */
  {
    id: "cloud-manager",
    title: "Cloud Manager",
    icon: CloudIcon,
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
  /** Migrate */
  {
    id: "migrate-to-v2",
    title: "Migrate to V2+",
    icon: AppIcon,
    component: createElement(Migrate),
  },
];

export { farmers };
export default [...app, ...telegramWeb, ...utils, ...farmers];
