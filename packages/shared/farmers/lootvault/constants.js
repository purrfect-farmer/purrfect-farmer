/** The drop's backend, which the mini app talks to for everything */
export const API_URL = "https://lootvault.lol/vx";

/** The header the page carries `initData` in */
export const INIT_DATA_HEADER = "X-TG-Init";

/** The LOOT jetton the drop pays out and levels against */
export const LOOT_TOKEN = "LOOT";

export const LOOT_JETTON_ADDRESS =
  "EQCM4DEzDVFLq7kaSodQX-8-u_aF9M9DDe1EePWsuMozqGkt";

/** LOOT amounts travel in nano, at 9 decimals */
export const LOOT_DECIMALS = 9;

/** The bot that hands out referral links */
export const REFERRAL_BOT_LINK = "https://t.me/LootVaultDexBot?start=ref_";

/** The drop's referral start params carry this prefix in front of the code */
export const REFERRAL_PREFIX = "ref_";

/** The page only collects mining once 1 LOOT has accrued, in nano */
export const MINIMUM_COLLECT = 1e9;

/** The page only collects tower income above this many LOOT */
export const MINIMUM_TOWER_COLLECT = 0.001;

/** The drop's withdrawal rules, used until the live ones have been read */
export const MINIMUM_WITHDRAWAL = 10000;

/** The error codes the backend answers with */
export const ERROR_CODE = Object.freeze({
  MAINTENANCE: "maintenance",
  BLOCKED: "blocked",
  WALLET_TAKEN: "wallet_taken",
  HISTORY_UNAVAILABLE: "blockchain_history_unavailable",
});

/** The captcha the page renders as a slider; any other type asks for an answer */
export const SLIDER_CAPTCHA = "slider";

/** The slide the captcha accepts, as the page measures it */
export const CAPTCHA_SLIDE = Object.freeze({
  MIN_DURATION: 400,
  MAX_DURATION: 1200,
  MIN_MOVES: 15,
  MAX_MOVES: 40,
});

/** A task's status on the board */
export const TASK_STATUS = Object.freeze({
  NEW: "new",
  READY: "ready",
  IN_PROGRESS: "in_progress",
  CLAIMED: "claimed",
});

/** Task checks that need the account to join a Telegram chat */
export const SOCIAL_CHECK_TYPES = new Set(["tg_channel", "tg_chat"]);

/** How long the page waits on a timed task when it names no wait */
export const DEFAULT_TASK_WAIT_SECONDS = 15;

/** A tower slot's type, by the key its floor lists it under */
export const TOWER_SLOT_TYPES = Object.freeze({
  cpu: 1,
  power: 2,
  cooler: 3,
  core: 4,
});

/** A withdrawal's status in the history */
export const WITHDRAWAL_STATUS = Object.freeze({
  PENDING: 0,
  PAID: 1,
  SENT: 2,
  REJECTED: 3,
});

export const PENDING_WITHDRAWAL_STATUSES = [WITHDRAWAL_STATUS.PENDING];

export const APPROVED_WITHDRAWAL_STATUSES = [
  WITHDRAWAL_STATUS.PAID,
  WITHDRAWAL_STATUS.SENT,
];
