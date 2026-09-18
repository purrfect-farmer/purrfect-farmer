/** The single source of truth for how a farmer status is shown */

/** Dot fill, as the status dot uses */
export const FARMER_STATUS_DOT_COLORS = {
  active: "bg-green-500",
  frozen: "bg-violet-500",
  banned: "bg-red-500",
  inactive: "bg-orange-500",
};

/** Text colour, as the status labels and the matching actions use */
export const FARMER_STATUS_TEXT_COLORS = {
  active: "text-green-500 dark:text-green-400",
  frozen: "text-violet-500 dark:text-violet-400",
  banned: "text-red-500 dark:text-red-400",
  inactive: "text-orange-500 dark:text-orange-400",
};

/** Human readable name for each status */
export const FARMER_STATUS_LABELS = {
  active: "Active",
  frozen: "Frozen",
  banned: "Banned",
  inactive: "Inactive",
};

/** Text colour for a mining freeze, which is a different fact from the farmer status */
export const MINING_FREEZE_COLORS = {
  frozen: "text-violet-500 dark:text-violet-400",
  urgent: "text-amber-500 dark:text-amber-400",
  distant: "text-blue-500 dark:text-blue-300",
};

/** The tint a mining freeze reads in, shared by every place that shows one
 * @param {{ frozen: boolean, msUntilFreeze: number|null, urgent: boolean }|null} freeze
 */
export const getMiningFreezeColor = (freeze) => {
  if (!freeze) return null;

  if (freeze.frozen) return MINING_FREEZE_COLORS.frozen;

  /** A deadline already behind us is as urgent as one about to land */
  const deadlinePassed =
    freeze.msUntilFreeze !== null && freeze.msUntilFreeze <= 0;

  return deadlinePassed || freeze.urgent
    ? MINING_FREEZE_COLORS.urgent
    : MINING_FREEZE_COLORS.distant;
};

/** Text colour for the drop's buyer protection, worst standing first */
export const PROTECTION_COLORS = {
  revoked: "text-red-500 dark:text-red-400",
  nonbuyer: "text-amber-500 dark:text-amber-400",
  protected: "text-lime-500 dark:text-lime-300",
};

/** The tint buyer protection reads in, shared by the pill and the detail row
 * @param {{ revoked: boolean, dexBuyer: boolean }|null} protection
 */
export const getProtectionColor = (protection) => {
  if (!protection) return null;

  if (protection.revoked) return PROTECTION_COLORS.revoked;

  return protection.dexBuyer
    ? PROTECTION_COLORS.protected
    : PROTECTION_COLORS.nonbuyer;
};
