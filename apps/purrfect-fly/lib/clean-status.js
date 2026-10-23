/** Outcome of cleaning one account's profile */
export const PROFILE_CLEAN_STATUS = Object.freeze({
  CLEANED: "cleaned",
  UNCHANGED: "unchanged",
  SKIPPED: "skipped",
  FAILED: "failed",
});

/** Report icon for each status */
export const PROFILE_CLEAN_ICONS = Object.freeze({
  [PROFILE_CLEAN_STATUS.CLEANED]: "✅",
  [PROFILE_CLEAN_STATUS.UNCHANGED]: "➖",
  [PROFILE_CLEAN_STATUS.SKIPPED]: "⏭️",
  [PROFILE_CLEAN_STATUS.FAILED]: "❌",
});
