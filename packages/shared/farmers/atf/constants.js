/** Backstop for the withdrawal captcha loop */
export const WITHDRAWAL_CAPTCHA_ATTEMPTS = 5;

/** The app freezes mining 72h after the last start or claim */
export const MAX_MINING_CYCLE_SECONDS = 259200;

/** One-time tasks from the app's tasksConfig, without the disabled Instagram ones */
export const ONE_TIME_TASKS = [
  { id: "telegram_join", link: "https://t.me/AI_TRADING_FOREX" },
  { id: "telegram_join_fa", link: "https://t.me/ATFFARSI" },
  { id: "twitter_follow" },
  { id: "youtube_subscribe" },
];

/** Repeatable tasks from the app's tasksConfig, claimable once minSeconds pass after a start */
export const COOLDOWN_TASKS = [
  { id: "youtube_like_comment", minSeconds: 30 },
  { id: "twitter_retweet", minSeconds: 30 },
  { id: "website_visit", minSeconds: 10 },
  { id: "telegram_react_latest", minSeconds: 20 },
];

/** Repeatable task checked against the channel link in the Telegram bio */
export const BIO_TASK = {
  id: "bio_referral",
  bio: "https://t.me/AI_TRADING_FOREX",
};

/** Repeatable task checked against the eye emoji in the Telegram display name */
export const NAME_EYE_TASK = { id: "name_eye", emoji: "👁️" };

/** Most taps the app sends in one tap_v2_sync batch */
export const TAP_V2_BATCH_MAX = 240;

/** Seconds the app collects taps before each tap_v2_sync */
export const TAP_V2_BATCH_SECONDS = 30;

/** Human tap pace, well under the autoclick guard */
export const TAP_V2_TAPS_PER_SECOND = 5;

/** Time for a profile change to reach the drop's verifier */
export const PROFILE_PROPAGATION_SECONDS = 10;

/** Maximum number of attempts to solve a captcha */
export const MAX_CAPTCHA_ATTEMPTS = 10;

/** Maximum number of attempts to complete a login */
export const MAX_LOGIN_ATTEMPTS = 10;

/** Maximum number of attempts to sync a wallet */
export const MAX_SYNC_ATTEMPTS = 20;

/** Whether to solve the captcha before login */
export const SHOULD_SOLVE_CAPTCHA_BEFORE_LOGIN = true;

/** Device ID mode */
export const DEVICE_ID_MODE = "random";

/* Record navigation batch */
export const RECORD_NAVIGATION_BATCH = true;

/** Record Daily Interaction */
export const RECORD_DAILY_INTERACTION = true;
