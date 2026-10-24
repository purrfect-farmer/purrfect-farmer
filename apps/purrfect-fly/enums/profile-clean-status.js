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

/** Progress label for each status */
export const PROFILE_CLEAN_LABELS = Object.freeze({
  [PROFILE_CLEAN_STATUS.CLEANED]: "Cleaned",
  [PROFILE_CLEAN_STATUS.UNCHANGED]: "Unchanged",
  [PROFILE_CLEAN_STATUS.SKIPPED]: "Skipped, the name is only the text",
  [PROFILE_CLEAN_STATUS.FAILED]: "Failed",
});
