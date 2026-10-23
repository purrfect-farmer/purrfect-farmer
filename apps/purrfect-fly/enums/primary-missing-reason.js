import { FARMER_STATUS } from "./farmer-status.js";

/** Why the primary account was left out of a run */
export const PRIMARY_MISSING_REASON = Object.freeze({
  NOT_CONFIGURED: "not-configured",
  NOT_FOUND: "not-found",
  NO_SUBSCRIPTION: "no-subscription",
  NO_FARMER: "no-farmer",
  FROZEN: FARMER_STATUS.FROZEN,
  BANNED: FARMER_STATUS.BANNED,
  TERMINATED: "terminated",
  FARMING_DISABLED: "farming-disabled",
  UNRESOLVED: "unresolved",
});
