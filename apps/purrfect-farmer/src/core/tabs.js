import AppIcon from "@/assets/images/icon.png?format=webp&w=80";
import CloudIcon from "@/assets/images/cloud.png?format=webp&w=80";
import CloudTelegramSessionIcon from "@/assets/images/cloud-telegram-session.png?format=webp&w=80";
import LocalTelegramSessionIcon from "@/assets/images/local-telegram-session.png?format=webp&w=80";
import TelegramCleanerIcon from "@/assets/images/telegram-cleaner.png?format=webp&w=80";
import TelegramWebAIcon from "@/assets/images/telegram-web-a.png?format=webp&w=80";
import TelegramWebKIcon from "@/assets/images/telegram-web-k.png?format=webp&w=80";
import WhiskersIcon from "@/assets/images/whiskers.png?format=webp&w=80";
import TinyFlyIcon from "@/assets/images/fly.png?format=webp&w=80";
import BackupAndRestoreIcon from "@/assets/images/backup-and-restore.png?format=webp&w=80";
import TelegramToPurrfectGramIcon from "@/assets/images/telegram-to-purrfect-gram.png?format=webp&w=80";

import { createElement } from "react";
import { lazy } from "react";

import farmers from "./farmers";

export const Welcome = lazy(() => import("@/app/Welcome"));
export const Browser = lazy(() => import("@/app/Browser"));
export const TelegramWeb = lazy(() => import("@/app/TelegramWeb"));
export const TelegramCleaner = lazy(() => import("@/app/TelegramCleaner"));
export const TinyFly = lazy(() => import("@/app/TinyFly"));
export const HeadlessPicker = lazy(() => import("@/app/HeadlessPicker"));
export const BackupAndRestore = lazy(() => import("@/app/BackupAndRestore"));
export const WhiskersToFarmer = lazy(() => import("@/app/WhiskersToFarmer"));
export const TelegramToPurrfectGram = lazy(() =>
  import("@/app/TelegramToPurrfectGram")
);
export const Migrate = lazy(() => import("@/app/Migrate"));
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
  /** Headless Mode */
  {
    id: "headless-mode",
    title: "Headless Mode",
    icon: AppIcon,
    component: createElement(HeadlessPicker),
  },
  /** Local Telegram Session */
  {
    id: "local-telegram-session",
    title: "Local Telegram Session",
    icon: LocalTelegramSessionIcon,
    component: createElement(LocalTelegramSession),
  },

  /** Cloud Telegram Session */
  {
    id: "cloud-telegram-session",
    title: "Cloud Telegram Session",
    icon: CloudTelegramSessionIcon,
    component: createElement(CloudTelegramSession),
  },

  /** Cloud Manager */
  {
    id: "cloud-manager",
    title: "Cloud Manager",
    icon: CloudIcon,
    component: createElement(CloudManager),
  },

  /** Telegram Cleaner */
  {
    id: "telegram-cleaner",
    title: "Telegram Cleaner",
    icon: TelegramCleanerIcon,
    component: createElement(TelegramCleaner),
  },

  /** Tiny Fly */
  {
    id: "tiny-fly",
    title: "Tiny Fly",
    icon: TinyFlyIcon,
    component: createElement(TinyFly),
  },

  /** Telegram to Purrfect Gram */
  {
    id: "telegram-to-purrfect-gram",
    title: "Telegram to Purrfect Gram",
    icon: TelegramToPurrfectGramIcon,
    component: createElement(TelegramToPurrfectGram),
  },

  /** Whiskers to Farmer */
  {
    id: "whiskers-to-farmer",
    title: "Whiskers to Farmer",
    icon: WhiskersIcon,
    component: createElement(WhiskersToFarmer),
  },

  /** Backup and Restore */
  {
    id: "backup-and-restore",
    title: "Backup and Restore",
    icon: BackupAndRestoreIcon,
    component: createElement(BackupAndRestore),
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
