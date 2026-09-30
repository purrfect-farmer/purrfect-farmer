/** How many queued accounts a list shows, to stay under Telegram's limit */
export const ASSIST_QUEUE_PREVIEW = 100;

/** Where a helper records the withdrawal it last placed for someone else */
export const ASSIST_RECORD_KEY = "assistLastWithdrawal";

/** Where a helper keeps the last withdrawal it saw settled for someone else */
export const ASSIST_HELPED_KEY = "assistLastHelped";

/** The loop an account is claimed by, so the two never work the same one */
export const ASSIST_OWNER = "assist";
export const CULTIVATE_OWNER = "cultivate";

/** Where an account records the wallet that last sent it tokens */
export const LAST_FUNDER_KEY = "autoLastFunder";

/** What the last boost sent an account, so a later run can send the same again */
export const LAST_BOOST_KEY = "autoLastBoost";

/** Where the farmer stores what an account last looked like */
export const SNAPSHOT_KEY = "autoSnapshot";

/** What a run may do about the DEX buyer standing a withdrawal consumes */
export const REQUALIFY_STRATEGIES = ["off", "resync", "boost"];

/** Whether a flip moves accounts off their own wallet or back onto it */
export const FLIP_DIRECTIONS = ["flip", "restore"];

/** How the requalify strategies read as a setting */
export const REQUALIFY_LABELS = {
  off: "Disabled",
  resync: "Re-sync wallet",
  boost: "Second boost pass",
};

/** And how they read as something that was just done to an account */
export const REQUALIFY_ACTIONS = {
  resync: "a wallet re-sync",
  boost: "a second boost",
};

/** Shared by every sender, since none of these messages wants a preview */
export const NOTIFICATION_OPTIONS = {
  ["link_preview_options"]: {
    ["is_disabled"]: true,
  },
};

/** The run settings with their defaults, validated the way the request body cannot be */
export function normalizeOptions({
  amount = "",
  delay = 0,
  difference = 0,
  freeze = false,
  includeFrozen = false,
  includeRevoked = false,
  withdrawAfterBoost = false,
  reuseLastAmount = false,
  retainFunds = false,
  onlyConnectWallet = false,
  requalify = "boost",
  ignorePending = false,
  runFarmer = true,
  repeat = false,
  repeatInterval = 15,
  assistInterval = 10,
  cultivateInterval = 10,
  trustedWithdrawDirectly = false,
  trustedAssist = false,
  flipDirection = "flip",
  flipAfterBoost = false,
  requesters = [],
} = {}) {
  return {
    amount,
    delay: Number(delay),
    difference: Number(difference),
    freeze,
    includeFrozen,
    includeRevoked,
    withdrawAfterBoost,
    reuseLastAmount,
    retainFunds,
    onlyConnectWallet,
    requalify: REQUALIFY_STRATEGIES.includes(requalify) ? requalify : "boost",
    ignorePending,
    runFarmer,
    repeat,
    repeatInterval: Number(repeatInterval),
    assistInterval: Number(assistInterval),
    cultivateInterval: Number(cultivateInterval),
    trustedWithdrawDirectly,
    trustedAssist,
    flipDirection: FLIP_DIRECTIONS.includes(flipDirection)
      ? flipDirection
      : "flip",
    flipAfterBoost,
    requesters,
  };
}
