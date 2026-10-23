/** The drop's backend, which the mini app talks to for everything */
export const API_URL = "https://server.victors.company/api";

/** The VIC jetton the drop pays out and levels against */
export const VIC_JETTON_ADDRESS =
  "EQClb4h8Wnqx-X_sKMFExqxcQusCktlMHxYZ2M80A_WnnFUe";

/** The domain the page signs its TON proof for */
export const TON_PROOF_DOMAIN = "app.victors.company";

/** Cloudflare Turnstile guarding the login, as the loading screen renders it */
export const TURNSTILE_SITE_KEY = "0x4AAAAAAFD0KRgPRFVwDvgn";

export const TURNSTILE_PAGE_URL = "https://app.victors.company/";

/** The error code the backend answers with once the human pass is missing or stale */
export const HUMAN_REQUIRED_CODE = "HUMAN_REQUIRED";

/** The error code a banned account gets, with whether it may reset and the terms it must accept */
export const BANNED_CODE = "BANNED";

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
export const MINIMUM_WITHDRAWAL = 1000;

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

/** TON kept aside for the verification transfer's fees */
export const VERIFICATION_GAS_TON = 0.02;

/** Pause between mine moves, close to the page's pace so the run never idles out */
export const MINE_MOVE_DELAY_SECONDS = 1;

/** Deep Mine stops for the day once its net is down this much, a shovel's price */
export const MINE_DAILY_LOSS_LIMIT = 25;

/** Underground's live websocket games, which the farmer only reports on */
export const UNDERGROUND_GAMES = ["crew", "rush"];

/** How the page polls a mint: a first wait, then steady checks */
export const NFT_MINT_FIRST_CHECK_SECONDS = 4;

export const NFT_MINT_CHECK_SECONDS = 6;

export const NFT_MINT_CHECK_ATTEMPTS = 14;

/** TON kept aside on top of the mint price, as the page warns */
export const NFT_MINT_GAS_TON = 0.05;

/** How often, and how long, the verification is polled after paying */
export const VERIFICATION_CHECK_ATTEMPTS = 6;

export const VERIFICATION_CHECK_INTERVAL_SECONDS = 6;

/** A pending verification paid this long ago is assumed lost and paid again */
export const VERIFICATION_RETRY_HOURS = 6;
