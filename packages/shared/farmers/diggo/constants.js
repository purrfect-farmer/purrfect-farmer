/** The game's backend, served from the page's own origin */
export const API_URL = "https://diggo.linkpc.net/api";

/** The domain the page signs its TON proof for */
export const TON_PROOF_DOMAIN = "diggo.linkpc.net";

/** TON mainnet, the only network the backend binds */
export const TON_NETWORK = "-239";

/** The chests are read and opened in live mode, as players see them */
export const CHEST_MODE = "live";

/** A few seconds past the confirm time, so a self-reported task is never confirmed early */
export const SOCIAL_CONFIRM_MARGIN_SECONDS = 3;

/** How often, and how long, the ad task is polled for the provider's callback, as the page does */
export const AD_CHECK_ATTEMPTS = 10;

export const AD_CHECK_INTERVAL_SECONDS = 1.5;

/** The on-chain DIGGO jetton the Auto boosts, swaps and collects */
export const DIGGO_TOKEN = "DIGGO";

export const DIGGO_JETTON_ADDRESS =
  "EQD3jHVnwB6upXRphFb-PrWlmiFe6ofGs5pUCDSd-dEVGHNX";

/** The page the risk challenge's Turnstile is rendered on */
export const PAGE_URL = "https://diggo.linkpc.net/";

/** Jetton withdrawal statuses, as the history reports them */
export const PENDING_WITHDRAWAL_STATUSES = ["pending", "approved", "paying"];

export const APPROVED_WITHDRAWAL_STATUSES = ["paid"];

export const FLAGGED_WITHDRAWAL_STATUSES = ["cancelled", "rejected"];

/** Withdrawals carry at most six decimals, as the page validates them */
export const WITHDRAWAL_DECIMALS = 6;

/** Conversions take TON above this, in nanotons, with at most nine decimals */
export const MINIMUM_CONVERSION_NANO = 50000000n;

/** Conversion errors worth one fresh quote before giving up */
export const CONVERSION_PRICE_ERRORS = [
  "conversion_price_warming_up",
  "conversion_price_moving",
  "conversion_price_unavailable",
  "conversion_price_stale",
  "quote_expired",
];

/** How often, and how long, the activation is polled after paying its fee */
export const ACTIVATION_CHECK_ATTEMPTS = 6;

export const ACTIVATION_CHECK_INTERVAL_SECONDS = 10;

/** Readable messages for the backend's error codes */
export const ERROR_MESSAGES = {
  invalid_amount: "Invalid amount",
  insufficient_balance: "Insufficient balance",
  quote_expired: "Quote expired",
  price_changed: "Price changed",
  withdrawal_below_minimum: "Below the withdrawal minimum",
  withdrawal_pending_limit: "A withdrawal is already pending",
  ton_wallet_required: "A TON wallet must be bound",
  jetton_withdrawals_paused: "Jetton withdrawals are paused",
  dex_transition_paused: "Paused for the DEX transition",
  dex_conversion_unavailable: "Conversion is unavailable",
  ton_price_unavailable: "TON price is unavailable",
  conversion_price_warming_up: "Conversion price is warming up",
  conversion_price_moving: "Conversion price is moving",
  conversion_price_unavailable: "Conversion price is unavailable",
  conversion_price_stale: "Conversion price is stale",
  risk_challenge_required: "A security check is required",
  ton_payment_rejected: "The payment was rejected",
};

/** The level table the page levels the holding against */
export const MINING_LEVELS_URL = "https://diggo.linkpc.net/mining-levels.json";

/** The page's smallest buy and deposit, when the state does not say */
export const MINIMUM_BUY_TON = 0.5;

export const MINIMUM_DEPOSIT_TON = 0.1;

/** TON kept aside for the wallet's own fees when paying an order */
export const PAYMENT_GAS_TON = 0.05;

/** How often, and how long, an order or deposit is polled after paying */
export const PAYMENT_CHECK_ATTEMPTS = 18;

export const PAYMENT_CHECK_INTERVAL_SECONDS = 10;

/** Order statuses that end the wait */
export const SETTLED_ORDER_STATUSES = ["paid", "cancelled", "expired"];

/** The tasks the page offers, in the order it lists them */
export const TASK_TITLES = {
  checkin: "Daily Check-In",
  play: "Reach Level",
  telegram: "Join Community",
  community_react: "React in Community",
  x: "X",
  x_follow: "Follow on X",
  x_post: "Engage X Post",
  invite: "Invite Friends",
  ad: "Watch Ad",
};
