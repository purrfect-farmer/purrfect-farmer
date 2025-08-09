import { createElement, lazy } from "react";

const TerminalFarmer = lazy(() => import("@/partials/TerminalFarmer"));

export function createFarmer(FarmerClass, options) {
  return {
    ...options,
    FarmerClass,
    id: FarmerClass.id,
    title: FarmerClass.title,
    host: FarmerClass.host,
    domains: FarmerClass.domains,
    telegramLink: FarmerClass.telegramLink,
    netRequest: {
      origin: `https://${FarmerClass.host}`,
      domains: FarmerClass.domains,
    },
    component: createElement(TerminalFarmer),
  };
}
