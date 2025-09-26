import { createElement, lazy } from "react";

const TerminalFarmer = lazy(() => import("@/partials/TerminalFarmer"));

export function createFarmer(FarmerClass, options) {
  const {
    id,
    title,
    host,
    interval,
    domains,
    telegramLink,
    apiDelay,
    cacheAuth,
    cacheTelegramWebApp,
  } = FarmerClass;
  return {
    FarmerClass,
    id,
    title,
    host,
    interval,
    domains,
    apiDelay,
    telegramLink,
    cacheAuth,
    cacheTelegramWebApp,
    netRequest: {
      origin: `https://${host}`,
      domains,
    },
    component: createElement(TerminalFarmer),
    syncToCloud: true,
    ...options,
  };
}
