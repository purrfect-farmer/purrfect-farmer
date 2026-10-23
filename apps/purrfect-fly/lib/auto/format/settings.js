import { FLIP_DIRECTION } from "../../../enums/flip-direction.js";
import { REQUALIFY_LABELS } from "../constants.js";

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
  retain: ["Retain", (ctx) => formatRetain(ctx)],
  minCollect: [
    "Min. to collect",
    (ctx) =>
      ctx.options.minCollect
        ? `${ctx.options.minCollect} ${ctx.token}`
        : "(none)",
  ],
  includeFrozen: ["Include frozen"],
  includeRevoked: ["Include revoked"],
  withdrawAfterBoost: ["Withdraw after boost"],
  reuseLastAmount: ["Reuse last amount"],
  retainFunds: ["Retain funds"],
  onlyConnectWallet: ["Only connect wallet"],
  requalify: [
    "Requalify",
    (ctx) => REQUALIFY_LABELS[ctx.options.requalify] || ctx.options.requalify,
  ],
  ignorePending: ["Ignore pending"],
  freeze: ["Freeze", (ctx) => toggle(ctx.shouldFreezeAccounts())],
  runFarmer: ["Run Farmer"],
  repeat: ["Repeat"],
  repeatInterval: [
    "Repeat Interval",
    (ctx) => `${ctx.options.repeatInterval}h`,
  ],
  assistInterval: [
    "Assist Interval",
    (ctx) => `${ctx.options.assistInterval}m`,
  ],
  cultivateInterval: [
    "Cultivate Interval",
    (ctx) => `${ctx.options.cultivateInterval}m`,
  ],
  trustedWithdrawDirectly: ["Trusted withdraw directly"],
  trustedAssist: ["Trusted assist others"],
  flipDirection: [
    "Direction",
    (ctx) =>
      ctx.options.flipDirection === FLIP_DIRECTION.FLIP
        ? "Flip to the other version"
        : "Restore own wallet",
  ],
  flipAfterBoost: ["Flip after boost"],
  slippage: ["Slippage", (ctx) => `${Number(ctx.options.slippage) * 100}%`],
};

/** What a collect leaves on each account: nothing, a fixed amount or a range */
function formatRetain(ctx) {
  const { retainMin, retainMax } = ctx.options;
  const range = [retainMin, retainMax].filter(Boolean);

  if (!range.length) return "(none)";
  if (range.length === 1 || retainMin === retainMax) {
    return `${range[0]} ${ctx.token}`;
  }
  return `${retainMin}-${retainMax} ${ctx.token}`;
}

/** An on/off setting */
function toggle(value) {
  return value ? "Enabled" : "Disabled";
}

/** A run setting's label and how its value reads */
export function readSetting(ctx, name) {
  const [label, read] = SETTINGS[name];
  const value = read ? read(ctx) : toggle(ctx.options[name]);

  return [label, value];
}
