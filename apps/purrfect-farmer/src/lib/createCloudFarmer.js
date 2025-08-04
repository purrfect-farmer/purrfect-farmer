import { createElement } from "react";
import { lazy } from "react";

import { createFarmer } from "./createFarmer";

const CloudFarmer = lazy(() => import("@/partials/CloudFarmer"));

/** Create Cloud Farmer */
export const createCloudFarmer = (options) => {
  return createFarmer({
    cacheAuth: false,
    cacheTelegramWebApp: false,
    tasks: {},
    ...options,
    syncToCloud: true,
    component: createElement(CloudFarmer),
  });
};
