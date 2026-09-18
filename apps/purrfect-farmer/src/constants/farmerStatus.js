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
