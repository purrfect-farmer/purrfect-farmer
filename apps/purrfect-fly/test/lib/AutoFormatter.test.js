import assert from "node:assert/strict";
import { test } from "node:test";
import AutoFormatter from "../../lib/auto/AutoFormatter.js";
import { normalizeOptions } from "../../lib/auto/constants.js";

/** Just enough of a context for the formatter */
function createFormatter(options = {}) {
  const ctx = {
    title: "ATF Auto",
    token: "ATF",
    accounts: [{}, {}, {}],
    options: normalizeOptions(options),
    shouldFreezeAccounts() {
      return Boolean(this.options.repeat || this.options.freeze);
    },
  };

  return new AutoFormatter(ctx);
}

test("settings read the way the old per-setting formatters did", () => {
  const fmt = createFormatter({ delay: 5, retainFunds: true, amount: "10" });

  assert.equal(fmt.formatSetting("accounts"), "<b>|</b> Accounts to process: <b>3</b>");
  assert.equal(fmt.formatSetting("delay"), "<b>|</b> Delay: <b>5m</b>");
  assert.equal(fmt.formatSetting("retainFunds"), "<b>|</b> Retain funds: <b>Enabled</b>");
  assert.equal(fmt.formatSetting("amount"), "<b>|</b> Max. Amount: <b>10 ATF</b>");
  assert.equal(fmt.formatSetting("requalify"), "<b>|</b> Requalify: <b>Second boost pass</b>");
});

test("freeze follows repeat", () => {
  const fmt = createFormatter({ repeat: true });

  assert.equal(fmt.formatSetting("freeze"), "<b>|</b> Freeze: <b>Enabled</b>");
});

test("withdrawal outcomes", () => {
  const fmt = createFormatter();

  assert.equal(
    fmt.formatWithdrawalOutcome({
      label: "L",
      status: true,
      amount: "5",
      message: "ok",
      position: "(1/2)",
    }),
    "🤑 Withdrawn <b>(L)</b> - <i>5 ATF</i> (1/2)\n<i>Message: ok</i>",
  );

  assert.equal(
    fmt.formatWithdrawalOutcome({
      label: "L",
      status: false,
      skipped: true,
      amount: "0",
      message: "busy",
    }),
    "⏩ Skipped <b>(L)</b>\n<i>Reason: busy</i>",
  );

  assert.equal(
    fmt.formatWithdrawalOutcome({
      label: "L",
      status: false,
      message: "boom",
      detail: " directly",
    }),
    "❌ Failed to withdraw <b>(L)</b> directly\n<i>Reason: boom</i>",
  );
});

test("preview lists are capped", () => {
  const fmt = createFormatter();
  const lines = fmt.formatPreviewList(
    Array.from({ length: 105 }, (_, i) => i),
    (item) => String(item),
  );

  assert.equal(lines.length, 101);
  assert.equal(lines.at(-1), "<i>...and 5 more.</i>");
});
