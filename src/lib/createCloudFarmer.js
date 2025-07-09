import { createElement } from "react";
import { lazy } from "react";

const CloudFarmer = lazy(() => import("@/partials/CloudFarmer"));

/** Create Cloud Farmer */
export const createCloudFarmer = (options) => {
  return {
    cacheAuth: false,
    ...options,
    syncToCloud: true,
    component: createElement(CloudFarmer),
  };
};
