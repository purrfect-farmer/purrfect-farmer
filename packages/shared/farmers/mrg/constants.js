/** The drop's backend, which the mini app talks to for everything */
export const API_URL = "https://mrg.up.railway.app/api";

/** Mine Rare Gram, the jetton whose holding sets the miner level */
export const MRG_JETTON_ADDRESS =
  "EQDj-zlSvj4Au154XjsU7ATzt13p8JjYEs0weVv1rVbCJSn0";

/** The domain the page signs its TON proof for */
export const TON_PROOF_DOMAIN = "app.mrgtoken.xyz";

/** Cloudflare Turnstile guarding claims and withdrawals, as the human check renders it */
export const TURNSTILE_SITE_KEY = "0x4AAAAAAFI-XXL7bFNbLU_J";

export const TURNSTILE_PAGE_URL = "https://app.mrgtoken.xyz/";

/** The error code the backend answers with once the human check is missing or stale */
export const HUMAN_CHECK_REQUIRED_CODE = "HUMAN_CHECK_REQUIRED";

/** The claim refusal for a task the account may never take, which the page hides for good */
export const TASK_INELIGIBLE_CODE = "TASK_INELIGIBLE";

/** Withdrawal refusals the page answers with an alert and a reload */
export const SESSION_STALE_CODE = "SESSION_STALE";

export const NO_APP_SESSION_CODE = "NO_APP_SESSION";

/** A human check this close to expiry is renewed rather than risked mid-run */
export const HUMAN_CHECK_EXPIRY_MARGIN_SECONDS = 10 * 60;

/** How long the page leaves a task open before it lets the claim through */
export const TASK_DWELL_SECONDS = 15;

/** The windows the page waits out per recurring task type, in hours */
export const TASK_COOLDOWN_HOURS = {
  recurring_1h: 1,
  recurring_3h: 3,
  recurring_6h: 6,
  recurring_12h: 12,
  recurring_24h: 24,
};

/** The page falls back to this window for a recurring type it does not know */
export const DEFAULT_TASK_COOLDOWN_HOURS = 3;

/** Below this the drop's own claim button stays disabled */
export const MINIMUM_CLAIMABLE_MINING = 0.0001;

/** A mining session runs this long from its snapshot, then freezes until claimed */
export const MINING_WINDOW_SECONDS = 24 * 60 * 60;

/** The Genesis NFT collection the drop discounts withdrawals for */
export const GENESIS_NFT_COLLECTION =
  "EQAwe5pFTrqv-sLqHQW8OzZ-COA2dpuxPM_dziNBGZZc1ixS";

/** What one NFT of each rarity takes off the fee, in percent */
export const NFT_RARITY_DISCOUNTS = { mythical: 35, rare: 20, common: 10 };

/** Any three NFTs discount more than the rarest of them on its own */
export const NFT_BUNDLE_SIZE = 3;

export const NFT_BUNDLE_DISCOUNT = 50;

/** The drop's withdrawal rules */
export const MINIMUM_WITHDRAWAL = 1000;

export const WITHDRAWAL_FEE = 70;

/** The backend refuses a withdrawal whose `initData` is this old, so the page asks for a reopen */
export const INIT_DATA_MAX_AGE_SECONDS = 6 * 60 * 60 - 300;

/** Daily check-in rewards by streak day, which loop every seven days */
export const CHECKIN_REWARDS = [5, 6, 7, 8, 9, 10, 15];

/** Task kinds the drop settles against the wallet's holding, with no link to open */
export const HOLD_TASK_TYPES = ["token_hold", "nft_hold"];

/** TON kept aside for the verification transfer's fees */
export const VERIFICATION_GAS_TON = 0.02;

/** The page waits 1.5s after paying, then polls every 5s for 3 minutes */
export const VERIFICATION_CHECK_FIRST_DELAY_SECONDS = 1.5;

export const VERIFICATION_CHECK_INTERVAL_SECONDS = 5;

export const VERIFICATION_CHECK_WINDOW_SECONDS = 180;

/** A verification paid this long ago without landing is assumed lost and paid again */
export const VERIFICATION_RETRY_HOURS = 6;

/** One withdrawal per this many hours, counted from the last completed one */
export const WITHDRAWAL_COOLDOWN_HOURS = 24;

/** How many fresh slider puzzles a withdrawal tries before giving up */
export const SLIDER_CAPTCHA_ATTEMPTS = 3;

/** The platform Telegram's WebApp reports on Android, which the page also names the device by when nothing else fits */
export const TELEGRAM_PLATFORM = "android";

/** Samsung model codes the page names, checked in its order */
export const SAMSUNG_MODELS = [
  [["A155", "A156"], "Galaxy A15"],
  [["A145", "A146"], "Galaxy A14"],
  [["A135", "A136"], "Galaxy A13"],
  [["A546"], "Galaxy A54"],
  [["A536"], "Galaxy A53"],
  [["S918"], "Galaxy S23 Ultra"],
  [["S911"], "Galaxy S23"],
  [["S928"], "Galaxy S24 Ultra"],
  [["S921"], "Galaxy S24"],
  [["G998"], "Galaxy S21 Ultra"],
];
