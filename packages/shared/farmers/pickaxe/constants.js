/** The drop's backend, which the mini app talks to for everything */
export const API_URL = "https://pxe.up.railway.app/api";

/** The domain a TON proof is signed for, as the page's TonConnect manifest names it */
export const TON_PROOF_DOMAIN = "app.pickaxeempire.com";

/** The mini app's direct link, which invite codes are appended to */
export const MINI_APP_LINK = "https://t.me/PickaxeEmpireApp/app";

/** The headers the page carries on every call */
export const HEADER = Object.freeze({
  INIT_DATA: "x-telegram-init-data",
  INSTALL_ID: "x-install-id",
  PLATFORM: "x-tg-platform",
});

/** The PXE jetton the drop pays out and levels against */
export const PXE_TOKEN = "PXE";

export const PXE_JETTON_ADDRESS =
  "EQC6jshzJS1bL0hKVtMfmfcHruJGJPMK7m5A4Oi-EMk6aR5h";

/** The drop's withdrawal minimum, used until the live one has been read */
export const MINIMUM_WITHDRAWAL = 500;

/** The withdrawal fee, by the smallest amount each one applies from */
export const WITHDRAWAL_FEES = Object.freeze([
  { from: 10000, fee: 50 },
  { from: 5000, fee: 60 },
  { from: 500, fee: 70 },
]);

/** How long the page's withdrawal form is open before submitting, in milliseconds */
export const WITHDRAWAL_FORM_MS = Object.freeze({ MIN: 4000, MAX: 15000 });

/** The error codes the backend answers with */
export const ERROR_CODE = Object.freeze({
  EXPIRED: "expired",
  MAINTENANCE: "maintenance",
});

/** A task's kind on the board */
export const TASK_KIND = Object.freeze({
  LINK: "link",
  CHANNEL: "channel",
  PARTNER: "partner",
  AUTO: "auto",
  HOLD: "hold",
  STORY: "story",
});

/** Task kinds the farmer can never pass: a story needs a real post, a partner its own app */
export const SKIPPED_TASK_KINDS = new Set([TASK_KIND.STORY, TASK_KIND.PARTNER]);

/** A task's status for the account */
export const TASK_STATUS = Object.freeze({
  TODO: "todo",
  STARTED: "started",
  READY: "ready",
  COOLDOWN: "cooldown",
  LOCKED: "locked",
  DONE: "done",
});

/** The Ancient Pass's status, which opens mining once active */
export const PASS_STATUS = Object.freeze({
  NONE: "none",
  AWAITING: "awaiting",
  PAID: "paid",
  MINTING: "minting",
  REVIEW: "review",
  ACTIVE: "active",
  REVOKED: "revoked",
});

/** Pass statuses whose payment has already been seen, so it is never paid again */
export const PAID_PASS_STATUSES = new Set([
  PASS_STATUS.PAID,
  PASS_STATUS.MINTING,
  PASS_STATUS.REVIEW,
]);

/** TON kept aside for the wallet's own fees when paying for the pass */
export const PASS_GAS_TON = 0.05;

/** How the drop is polled after paying for the pass */
export const PASS_CHECK_FIRST_SECONDS = 10;
export const PASS_CHECK_SECONDS = 5;
export const PASS_CHECK_ATTEMPTS = 24;

/** How long a sent pass payment is only polled before it may be paid again, as the page waits */
export const PASS_SENT_WINDOW_MINUTES = 20;

/** The storage key for when the pass payment was last sent */
export const PASS_SENT_AT_KEY = "passSentAt";

/** Friend rewards below this are not worth claiming, as the page hides them */
export const MINIMUM_FRIENDS_REWARD = 0.01;

/** A withdrawal's status in the account */
export const WITHDRAWAL_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  SENDING: "sending",
  REVIEW: "review",
  SENT: "sent",
  FAILED: "failed",
  DECLINED: "declined",
  REJECTED: "rejected",
});

export const PENDING_WITHDRAWAL_STATUSES = [
  WITHDRAWAL_STATUS.PENDING,
  WITHDRAWAL_STATUS.APPROVED,
  WITHDRAWAL_STATUS.SENDING,
  WITHDRAWAL_STATUS.REVIEW,
];

export const APPROVED_WITHDRAWAL_STATUSES = [WITHDRAWAL_STATUS.SENT];

export const FLAGGED_WITHDRAWAL_STATUSES = [
  WITHDRAWAL_STATUS.FAILED,
  WITHDRAWAL_STATUS.DECLINED,
  WITHDRAWAL_STATUS.REJECTED,
];
