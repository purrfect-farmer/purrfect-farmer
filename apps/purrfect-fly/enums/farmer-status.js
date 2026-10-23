/** Lifecycle state of a farmer row */
export const FARMER_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  FROZEN: "frozen",
  BANNED: "banned",
});

/** Statuses that keep an account out of every farming run */
export const BLOCKED_FARMER_STATUSES = Object.freeze([
  FARMER_STATUS.FROZEN,
  FARMER_STATUS.BANNED,
]);
