import { createElement, lazy } from "react";

const TerminalFarmer = lazy(() => import("@/partials/TerminalFarmer"));

export function createFarmer(FarmerClass, options) {
  return {
    FarmerClass,
    ...FarmerClass,
    netRequest: {
      origin: `https://${FarmerClass.host}`,
      domains: FarmerClass.domains,
    },
    component: createElement(TerminalFarmer),
    ...options,
  };
}
