import auto from "../../autos/victors-2-auto.js";

/** The drop's backend, which the mini app talks to for everything */
export const API_URL = "https://server.victors.company/api";

/** The bot the mini app opens from */
export const BOT_USERNAME = "Victors_Company_bot";

/** The token the drop mines, pays out and levels against */
export const TOKEN_SYMBOL = auto.token;

export const VICX_JETTON_ADDRESS = auto.jettonAddress;

/** The domain the page signs its TON proof for */
export const TON_PROOF_DOMAIN = "app.victors.company";

/** Cloudflare Turnstile guarding the login, as the loading screen renders it */
export const TURNSTILE_SITE_KEY = "0x4AAAAAAFD0KRgPRFVwDvgn";

export const TURNSTILE_PAGE_URL = "https://app.victors.company/";

/** The actions the page renders its Turnstile widgets with */
export const TURNSTILE_ACTION = Object.freeze({
  LOGIN: "login",
});

/** The error code the backend answers with once the human pass is missing or stale */
export const HUMAN_REQUIRED_CODE = "HUMAN_REQUIRED";

/** The error code a banned account gets, with whether it may reset and the terms it must accept */
export const BANNED_CODE = "BANNED";

/** The Mine Pass statuses, as the account state reports them */
export const PASS_STATUS = Object.freeze({
  NONE: "none",
  AWAITING: "awaiting",
  ACTIVE: "active",
  WRONG_WALLET: "wrong_wallet",
  DESTROYED: "destroyed",
  REVOKED: "revoked",
});

/** How the page polls a pass order: a first wait, then steady checks */
export const PASS_CHECK_FIRST_SECONDS = 4;

export const PASS_CHECK_SECONDS = 5;

export const PASS_CHECK_ATTEMPTS = 24;

/** TON kept aside on top of the pass price, as the page warns */
export const PASS_GAS_TON = 0.02;

/** Where the time of the last pass payment is stored */
export const PASS_SENT_AT_KEY = "passSentAt";

/** An awaited pass paid this long ago is assumed lost and ordered again */
export const PASS_RETRY_HOURS = 6;

/** The ad rewards the drop pays, and the endpoint each one lives on */
export const AD_KIND = Object.freeze({
  REWARD: "reward",
  TASK: "task",
});

export const AD_PATHS = Object.freeze({
  [AD_KIND.REWARD]: "/ad-reward",
  [AD_KIND.TASK]: "/ad-task",
});

/** The states an ad reward moves through */
export const AD_STATE = Object.freeze({
  OPEN: "open",
  PENDING: "pending",
  COOLDOWN: "cooldown",
  PAUSED: "paused",
});

/** How the page waits for AdsGram to report a watched ad */
export const AD_CHECK_SECONDS = 3;

export const AD_CHECK_ATTEMPTS = 30;

/** A stored pass this close to expiry is replaced rather than risked mid-run */
export const HUMAN_PASS_EXPIRY_MARGIN_SECONDS = 10 * 60;

/** Below this the drop refuses a mining claim */
export const MINIMUM_CLAIMABLE_MINING = 0.1;

/** The claim fails while the drop cannot read the on-chain holding, so it is retried in short steps */
export const MINING_CLAIM_ATTEMPTS = 10;

export const MINING_CLAIM_RETRY_SECONDS = 5;

/** How long the page leaves a link task open before it lets the claim through */
export const TASK_DWELL_SECONDS = 10;

/** The drop's withdrawal rules, used until the live config has been read */
export const MINIMUM_WITHDRAWAL = auto.minWithdrawal;

export const WITHDRAWAL_FEE = 70;

/** Withdrawal statuses, as the transaction history reports them */
export const PENDING_WITHDRAWAL_STATUSES = [
  "Pending",
  "Approved",
  "Processing",
];

export const APPROVED_WITHDRAWAL_STATUSES = ["Completed", "Paid"];

export const FLAGGED_WITHDRAWAL_STATUSES = ["Rejected", "Failed", "Cancelled"];

/** How many history rows are read when looking for withdrawals */
export const WITHDRAWAL_HISTORY_LIMIT = 20;

/** Pause between mine moves, close to the page's pace so the run never idles out */
export const MINE_MOVE_DELAY_SECONDS = 1;

/** Deep Mine stops for the day once its net is down this much, a shovel's price */
export const MINE_DAILY_LOSS_LIMIT = 25;

/** Underground's live websocket games, which the farmer only reports on */
export const UNDERGROUND_GAMES = ["crew", "rush"];

/** Last Lamp, a live websocket game the farmer leaves alone */
export const LAST_LAMP_GAME = "lamp";

/** The task kinds a claim alone settles once the link has been opened */
export const VISIT_TASK_KINDS = ["link_visit", "telegram_channel"];

/** The task kinds that need a story, a shared card, an emoji status or a boost, which the farmer does not make */
export const MANUAL_TASK_KINDS = [
  "story_share",
  "share_card",
  "emoji_status",
  "chat_boost",
];

/** The task kinds checked against the Telegram profile: a tag in the name, the referral link in the bio */
export const PROFILE_TASK_KIND = Object.freeze({
  NAME_TAG: "name_tag",
  BIO_LINK: "bio_link",
});

/** How long a profile change takes before the drop sees it */
export const PROFILE_PROPAGATION_SECONDS = 10;

/** How the page polls a mint: a first wait, then steady checks */
export const NFT_MINT_FIRST_CHECK_SECONDS = 4;

export const NFT_MINT_CHECK_SECONDS = 6;

export const NFT_MINT_CHECK_ATTEMPTS = 14;

/** TON kept aside on top of the mint price, as the page warns */
export const NFT_MINT_GAS_TON = 0.05;
