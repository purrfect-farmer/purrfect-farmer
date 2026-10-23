/** What a single-account run request did */
export const RUNNER_RESULT = Object.freeze({
  SKIPPED: "skipped",
  STARTED: "started",
  RUNNING: "running",
});

/** Report icon for each result */
export const RUNNER_RESULT_ICONS = Object.freeze({
  [RUNNER_RESULT.STARTED]: "✅",
  [RUNNER_RESULT.RUNNING]: "☑️",
  [RUNNER_RESULT.SKIPPED]: "❌",
});
