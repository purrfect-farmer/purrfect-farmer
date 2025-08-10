import { createElement, lazy } from "react";

const TerminalFarmer = lazy(() => import("@/partials/TerminalFarmer"));

export function createFarmer(FarmerClass, options) {
  return {
    FarmerClass,
    id: FarmerClass.id,
    title: FarmerClass.title,
    host: FarmerClass.host,
    domains: FarmerClass.domains,
    telegramLink: FarmerClass.telegramLink,
    apiDelay: FarmerClass.apiDelay,
    cacheAuth: FarmerClass.cacheAuth,
    cacheTelegramWebApp: FarmerClass.cacheTelegramWebApp,
    netRequest: {
      origin: `https://${FarmerClass.host}`,
      domains: FarmerClass.domains,
    },
    component: createElement(TerminalFarmer),
    syncToCloud: true,
    ...options,
  };
}
