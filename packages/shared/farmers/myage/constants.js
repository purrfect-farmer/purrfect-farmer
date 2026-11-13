import auto from "../../autos/myage-auto.js";

/** The drop's backend, which the mini app talks to for everything */
export const API_URL = "https://myageapp.xyz/api";

/** The domain a TON proof is signed for, as the page's TonConnect manifest names it */
export const TON_PROOF_DOMAIN = "myageapp.xyz";

/** The headers the page carries on its calls */
export const HEADER = Object.freeze({
  AUTHORIZATION: "authorization",
  IDEMPOTENCY_KEY: "idempotency-key",
});

/** The in-game name of the TON the drop pays out */
export const GRAM_CURRENCY = auto.currency;

/** The points the drop pays toward its airdrop */
export const AGE_POINTS = "AGE";

/** The drop's withdrawal minimum, used until the live one has been read */
export const MINIMUM_WITHDRAWAL = auto.minWithdrawal;

/** The decimal places a GRAM withdrawal is sent with, as the page fills its amount */
export const WITHDRAWAL_DECIMALS = 4;

/** The HTTP statuses the backend answers a session with when the account cannot play */
export const SESSION_STATUS = Object.freeze({
  UNAUTHORIZED: 401,
  BLOCKED: 403,
  REOPEN: 409,
  CLOSED: 503,
});

/** Statuses after which a withdrawal may have gone through without an answer */
export const UNSURE_WITHDRAWAL_STATUSES = new Set([0, 409]);

/** A task's kind on the board */
export const TASK_KIND = Object.freeze({
  CHANNEL: "channel",
  CHAT: "chat",
  CUSTOM: "custom",
  X_FOLLOW: "x_follow",
  DRAMA: "drama",
  PROOF: "proof",
});

/** Task kinds the farmer presses: joins the drop checks, and custom ones it only counts */
export const HANDLED_TASK_KINDS = new Set([
  TASK_KIND.CHANNEL,
  TASK_KIND.CHAT,
  TASK_KIND.CUSTOM,
]);

/** The pause between presses of a custom task, in seconds, as a person opens its link and comes back */
export const TASK_PRESS_SECONDS = Object.freeze({ MIN: 5, MAX: 12 });

/** The status a profile reward is refused with when the name or bio lacks what it pays for */
export const PROFILE_MISSING_STATUS = 400;

/** How long a profile change takes before the drop sees it, in seconds */
export const PROFILE_PROPAGATION_SECONDS = 10;

/** What a wheel's slice pays */
export const PRIZE_KIND = Object.freeze({
  AGE: "age",
  GRAM: "gram",
  PREMIUM: "premium",
});

/** The most spins of one wheel a run takes, guarding against a reply that never runs out */
export const MAXIMUM_SPINS_PER_RUN = 20;

/** A withdrawal's status in the account */
export const WITHDRAWAL_STATUS = Object.freeze({
  PENDING: "pending",
  SENDING: "sending",
  PAID: "paid",
  REJECTED: "rejected",
});

export const PENDING_WITHDRAWAL_STATUSES = [
  WITHDRAWAL_STATUS.PENDING,
  WITHDRAWAL_STATUS.SENDING,
];

export const APPROVED_WITHDRAWAL_STATUSES = [WITHDRAWAL_STATUS.PAID];

export const FLAGGED_WITHDRAWAL_STATUSES = [WITHDRAWAL_STATUS.REJECTED];
