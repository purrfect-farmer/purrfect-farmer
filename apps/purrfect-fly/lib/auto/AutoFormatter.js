import Decimal from "decimal.js";
import utils from "../utils.js";
import { summarizeVault } from "../AutoVault.js";
import {
  ASSIST_QUEUE_PREVIEW,
  REQUALIFY_ACTIONS,
  REQUALIFY_LABELS,
} from "./constants.js";
import { isTrusted, isWithdrawable } from "./summary.js";

/** How each run setting reads in an initiation message: a label, then a value read from the run */
const SETTINGS = {
  accounts: ["Accounts to process", (ctx) => ctx.accounts.length],
  delay: ["Delay", (ctx) => `${ctx.options.delay}m`],
  difference: ["Difference", (ctx) => `${ctx.options.difference}%`],
  amount: [
    "Max. Amount",
    (ctx) =>
      ctx.options.amount ? `${ctx.options.amount} ${ctx.token}` : "(none)",
  ],
  includeFrozen: ["Include frozen"],
  includeRevoked: ["Include revoked"],
  withdrawAfterBoost: ["Withdraw after boost"],
  reuseLastAmount: ["Reuse last amount"],
  retainFunds: ["Retain funds"],
  onlyConnectWallet: ["Only connect wallet"],
  requalify: [
    "Requalify",
    (ctx) =>
      REQUALIFY_LABELS[ctx.options.requalify] || ctx.options.requalify,
  ],
  ignorePending: ["Ignore pending"],
  freeze: ["Freeze", (ctx) => toggle(ctx.shouldFreezeAccounts())],
  runFarmer: ["Run Farmer"],
  repeat: ["Repeat"],
  repeatInterval: ["Repeat Interval", (ctx) => `${ctx.options.repeatInterval}h`],
  assistInterval: ["Assist Interval", (ctx) => `${ctx.options.assistInterval}m`],
  cultivateInterval: [
    "Cultivate Interval",
    (ctx) => `${ctx.options.cultivateInterval}m`,
  ],
  trustedWithdrawDirectly: ["Trusted withdraw directly"],
  trustedAssist: ["Trusted assist others"],
  flipDirection: [
    "Direction",
    (ctx) =>
      ctx.options.flipDirection === "flip"
        ? "Flip to the other version"
        : "Restore own wallet",
  ],
  flipAfterBoost: ["Flip after boost"],
};

/** An on/off setting */
function toggle(value) {
  return value ? "Enabled" : "Disabled";
}

/** Turns a run's accounts, summaries and settings into Telegram HTML */
class AutoFormatter {
  /** @param {import("./AutoContext.js").default} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  get token() {
    return this.ctx.token;
  }

  /** The unit the drop keeps its own balance in */
  get currency() {
    return this.ctx.currency;
  }

  get title() {
    return this.ctx.title;
  }

  /** Truncate address */
  truncateAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /** Format account position, against the whole run unless a pass sets its own size */
  formatAccountPosition(index, total = this.ctx.accounts.length) {
    return `(<i><b>${index + 1}</b>/<b>${total}</b></i>)`;
  }

  /** Format key value message */
  formatKeyValue(key, value) {
    return `<b>|</b> ${key}: <b>${value}</b>`;
  }

  /** Format account link */
  formatAccountLink(id) {
    return `<a href="tg://user?id=${id}">${id}</a>`;
  }

  /** Format address link */
  formatAddressLink(address) {
    return `<a href="https://tonviewer.com/${address}">${this.truncateAddress(address)}</a>`;
  }

  /** A requester from an export may have no Telegram user, so fall back to its address */
  formatRequesterLabel(requester) {
    return requester.userId
      ? this.formatAccountLink(requester.userId)
      : this.formatAddressLink(requester.address);
  }

  /** Format a summary's wallet, which carries no version when the drop links by raw address */
  formatWallet(wallet) {
    const link = this.formatAddressLink(wallet.address);
    return wallet.version ? `(${wallet.version.toUpperCase()}) ${link}` : link;
  }

  /** Format a unix timestamp for a notification */
  formatTimestamp(seconds) {
    return new Date(seconds * 1000).toUTCString();
  }

  /** Format how long is left until a unix timestamp, e.g. "3d 1h 45m" */
  formatCountdown(seconds) {
    return utils.formatDurationParts(seconds - Date.now() / 1000);
  }

  /** Format how long has passed since a millisecond timestamp, e.g. "2h 15m" */
  formatElapsed(since) {
    if (!since) return "an unknown time";

    return utils.formatDurationParts((Date.now() - Number(since)) / 1000);
  }

  /** A token amount, cut to four places */
  formatAmount(amount) {
    return new Decimal(amount || 0)
      .toDecimalPlaces(4, Decimal.ROUND_DOWN)
      .toString();
  }

  /** A numbered list capped at the preview size, with a line for the rest */
  formatPreviewList(items, row) {
    return [
      ...items
        .slice(0, ASSIST_QUEUE_PREVIEW)
        .map((item, position) => row(item, position)),
      ...(items.length > ASSIST_QUEUE_PREVIEW
        ? [`<i>...and ${items.length - ASSIST_QUEUE_PREVIEW} more.</i>`]
        : []),
    ];
  }

  /** Format the candidate queue, with the total across every candidate */
  formatCandidateQueue(candidates) {
    const total = candidates.reduce(
      (acc, candidate) => acc.plus(candidate.snapshot.balance || 0),
      new Decimal(0),
    );

    return [
      `📋 ${this.title} - Queue:`,
      ...this.formatPreviewList(candidates, (candidate, position) =>
        this.formatKeyValue(
          `${position + 1}. ${this.formatAccountLink(candidate.account.userId)}`,
          `${new Decimal(candidate.snapshot.balance || 0)} ${this.currency}`,
        ),
      ),
      this.formatKeyValue(
        "Total",
        `💰 ${this.formatAmount(total)} ${this.currency}`,
      ),
    ];
  }

  /** Format a run setting by name, as listed in an initiation message */
  formatSetting(name) {
    const [label, read] = SETTINGS[name];
    const value = read ? read(this.ctx) : toggle(this.ctx.options[name]);

    return this.formatKeyValue(label, value);
  }

  /** Format several run settings */
  formatSettings(...names) {
    return names.map((name) => this.formatSetting(name));
  }

  /** How many wallets the assist and cultivate loops have to work with */
  formatLoadedWallets() {
    const vault = summarizeVault(this.ctx.autoId);

    return this.formatKeyValue(
      "Loaded wallets",
      vault.loaded ? `${vault.accounts}` : "(none)",
    );
  }

  /** Format who sent an account its tokens */
  formatFundedBy(address) {
    return this.formatKeyValue(
      "Funded by",
      address ? this.formatAddressLink(address) : "Unknown",
    );
  }

  /** Format when an account's mining freezes, empty for drops that report no mining window */
  formatMiningFreeze(summary) {
    const mining = summary?.mining;

    if (mining?.frozen) {
      return "🧊 Mining is <b>frozen</b>";
    }

    const freezesAt = Number(mining?.freezesAt) || 0;

    if (!freezesAt) return "";

    return `❄️ Freezes <i>${this.formatTimestamp(freezesAt)}</i> - in <i>${this.formatCountdown(freezesAt)}</i>`;
  }

  /** The payout record an unverified account has earned, absent until the drop counts it */
  formatWithdrawalRecord(summary) {
    const withdrawal = summary?.withdrawal;
    const approved =
      typeof withdrawal?.approved === "number" ? withdrawal.approved : null;

    if (approved === null) return "";

    /** A verified account already says as much, so this only speaks for the rest */
    if (isTrusted(summary)) {
      return this.formatKeyValue(
        "Withdrawal Record",
        `🤝 Trusted - ${approved} approved, none ever flagged`,
      );
    }

    return this.formatKeyValue("Withdrawal Record", `${approved} approved`);
  }

  /** Format an account snapshot as notification detail lines, shared by every single-account notification */
  formatSummaryDetails(summary) {
    const freeze = this.formatMiningFreeze(summary);
    const record = this.formatWithdrawalRecord(summary);

    return (
      [
        this.formatKeyValue("Miner Level", summary.level),
        this.formatKeyValue("Holding", `${summary.holding} ${this.token}`),
        this.formatKeyValue(
          "Pool Balance",
          `${summary.balance} ${this.currency} ${isWithdrawable(summary) ? "🟩" : "🟧"}`,
        ),
        this.formatKeyValue("Verified", summary.verified ? "✅" : "❌"),
      ]
        /** The account's own payout record, absent on a summary that carries no withdrawals */
        .concat(record ? [record] : [])

        /** Buyer protection, absent on drops that do not report it */
        .concat(
          summary.protection
            ? [
                this.formatKeyValue(
                  "Buyer Protection",
                  summary.protection.revoked ? "🚫 Revoked" : "✅ Active",
                ),
                this.formatKeyValue(
                  "DEX Buyer",
                  summary.protection.dexBuyer ? "✅" : "❌",
                ),
              ]
            : [],
        )

        /** Wallet */
        .concat(
          summary.wallet
            ? [this.formatKeyValue("Wallet", this.formatWallet(summary.wallet))]
            : [],
        )

        /** Mining freeze */
        .concat(freeze ? [freeze] : [])

        /** Ban */
        .concat(
          summary.banned
            ? [
                "",
                "<b>🚫 Banned</b>",
                this.formatKeyValue("Reason", summary.banReason || "Unknown"),
              ]
            : [],
        )

        /** Risks */
        .concat(
          summary.risk?.flags?.length > 0
            ? [
                "",
                "<b>🟥 Risks</b>",
                this.formatKeyValue("Risk Score", summary.risk.score),
                this.formatKeyValue("Risk Updated", summary.risk.updatedAt),
                this.formatKeyValue("Risk Flags", summary.risk.flags.length),
                ...summary.risk.flags.map((flag) => `<b>- ${flag}</b>`),
              ]
            : [],
        )
    );
  }

  /** The one line every withdrawal path reports its outcome with
   * @param {object} outcome
   * @param {string} outcome.label - who was withdrawn for
   * @param {boolean} outcome.status - whether the drop took the request
   * @param {boolean} [outcome.skipped] - whether nothing was asked of the drop
   * @param {string} [outcome.amount] - what was asked for, left out when unknown
   * @param {string} [outcome.message] - what the drop or the error said
   * @param {string} [outcome.detail] - how it went through, e.g. " directly"
   * @param {string} [outcome.position] - where the account sits in the run
   * @param {string} [outcome.verb] - what a success is called
   * @param {string} [outcome.icon] - and its icon
   */
  formatWithdrawalOutcome({
    label,
    status,
    skipped,
    amount,
    message,
    detail = "",
    position = "",
    verb = "Withdrawn",
    icon = "🤑",
  }) {
    /** A skip that moved nothing has no amount worth reading */
    const showAmount =
      amount !== undefined &&
      amount !== null &&
      !(skipped && new Decimal(amount || 0).isZero());

    const amountPart = showAmount
      ? ` - <i>${amount} ${this.currency}</i>`
      : "";
    const positionPart = position ? ` ${position}` : "";

    const head = skipped
      ? `⏩ Skipped <b>(${label})</b>`
      : status
        ? `${icon} ${verb} <b>(${label})</b>`
        : `❌ Failed to withdraw <b>(${label})</b>`;

    const tail = message
      ? `\n<i>${status && !skipped ? "Message" : "Reason"}: ${message}</i>`
      : "";

    return `${head}${amountPart}${detail}${positionPart}${tail}`;
  }

  /** The one line a requalification attempt is worth in the withdrawal notification */
  formatRequalifyOutcome(link, result) {
    if (!result?.attempted) return [];

    const action = REQUALIFY_ACTIONS[result.strategy] || result.strategy;

    if (result.restored) {
      return [
        `♻️ Requalified <b>(${link})</b> - DEX Buyer is back ✅ after <i>${action}</i>`,
      ];
    }

    return [
      `⚠️ <b>(${link})</b> is still not a qualified DEX buyer after <i>${action}</i>${
        result.message ? `\n<i>Error: ${result.message}</i>` : ""
      }`,
    ];
  }
}

export default AutoFormatter;
