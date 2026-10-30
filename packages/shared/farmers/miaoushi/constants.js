/** The airdrop bot the entry is made through */
export const BOT_USERNAME = "miaoushi_airdrop_bot";

/** Whether a run also makes the airdrop entry */
export const AIRDROP_ENTRY_ENABLED = false;

/** The start param that opens the airdrop entry */
export const AIRDROP_START_PARAM = "airdrop";

/** The start param that opens the mining dashboard */
export const MINE_START_PARAM = "mine";

/** The website's entry lookup by wallet address */
export const LOOKUP_URL = "https://miaoushi.com/api/airdrop/lookup";

/** The chats an entry must stay in until the draw */
export const REQUIRED_CHATS = Object.freeze([
  "https://t.me/miaoushi",
  "https://t.me/miaoushi_ann",
]);

/** The callback data of the bot's buttons */
export const BOT_BUTTONS = Object.freeze({
  JOINED: "ad:joined",
  SKIP: "ad:skip",
  SUBMIT: "ad:submit",
  START_MINING: "mn:start",
});

/** The text each entry step's bot message carries */
export const BOT_STEPS = Object.freeze({
  WALLET: "Step 2 of 4 · Wallet",
  X_USERNAME: "send your X username",
  QUOTE: "Quote the pinned post",
  ENTERED: "Your Miaoushi airdrop entry",
  SUBMITTED: "ENTRY SUBMITTED",
});

/** The text of the bot's request for a wallet before the first session */
export const MINING_WALLET_TEXT = "wallet address to start mining";

/** The text the mining dashboard shows when no session runs */
export const NOT_MINING_TEXT = "Not mining";

/** A session ending within this many minutes is waited out and restarted */
export const MINING_WAIT_MINUTES = 5;

/** The longest handle X accepts */
export const X_USERNAME_MAX_LENGTH = 15;

/** X post ids count milliseconds from this epoch */
export const X_EPOCH = 1288834974657n;

/** The draw states the lookup reports */
export const DRAW_STATES = Object.freeze({
  PENDING: "pending",
  WON: "won",
  LOST: "lost",
  CANCELLED: "cancelled",
});

/** The quote-link check states the lookup reports */
export const LINK_STATES = Object.freeze({
  OK: "ok",
  PENDING: "pending",
  FAIL: "fail",
});

/** The most bot steps one entry run walks through */
export const MAX_ENTRY_STEPS = 12;
