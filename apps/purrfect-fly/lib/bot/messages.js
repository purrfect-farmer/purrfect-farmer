import { RUNNER_RESULT, RUNNER_RESULT_ICONS } from "../../enums/runner-result.js";

import { PROFILE_CLEAN_ICONS } from "../../enums/profile-clean-status.js";
import { formatDateTime } from "../format-date-time.js";
import utils from "../utils.js";

/** Details shown for an account whose run is mid-task */
function runningTaskInfo(result) {
  if (result.status !== RUNNER_RESULT.RUNNING) return null;

  return [
    `<b>TSK:</b> <code>${result.currentTask}</code>`,
    `<b>ELP:</b> <code>${result.elapsed}</code>`,
  ].join("\n");
}

/** Lines reporting which accounts a farmer run started */
export function farmingInitiatedMessage({
  title,
  link,
  telegramLink,
  results,
  totalCount,
  executedCount,
}) {
  const users = utils.formatUsers(
    results.map(({ account, result }) => {
      return {
        id: account.id,
        status: RUNNER_RESULT_ICONS[result.status] ?? "❌",
        session: telegramLink ? (account.session ? "🟨" : "🟪") : "",
        count: account?.farmer?.errorCount || 0,
        username: account.user?.username || "",
        title: account.title,
        info: runningTaskInfo(result),
      };
    }),
  );

  return [
    `<b>${title}</b>`,
    `<i>✅ Status: Initiated (${executedCount}/${totalCount})</i>\n`,
    `<blockquote><a href="${link || telegramLink}">Open ${
      link ? "Link" : "Telegram Bot"
    }</a></blockquote>${users}`,
    `<b>🗓️ Date</b>: ${formatDateTime()}`,
  ];
}

/** Lines reporting a finished profile cleanup */
export function profileCleanMessage({ text, fields, report, startDate, endDate }) {
  const users = utils.formatUsers(
    report.map(({ account, status }) => {
      return {
        id: account.id,
        status: PROFILE_CLEAN_ICONS[status],
        username: account.user?.username || "",
        title: account.title,
      };
    }),
  );

  const summary = Object.entries(PROFILE_CLEAN_ICONS)
    .map(([status, icon]) => {
      const total = report.filter((item) => item.status === status);
      return `${icon} ${total.length}`;
    })
    .join(" | ");

  return [
    `<b>🧹 Profile Cleanup</b>`,
    "<i>✅ Status: Completed</i>",
    `<b>Text</b>: <code>${utils.escapeHtml(text)}</code>`,
    `<b>Fields</b>: ${fields.join(", ")}`,
    summary,
    `\n<blockquote><i>Profiles cleaned!</i></blockquote>${users}`,
    `<b>🗓️ Start Date</b>: ${formatDateTime(startDate)}`,
    `<b>🗓️ End Date</b>: ${formatDateTime(endDate)}`,
  ];
}

/** Lines reporting a finished accounts update */
export function userUpdateMessage({ accounts, startDate, endDate }) {
  const users = utils.formatUsers(
    accounts.map((account) => {
      return {
        id: account.id,
        status: "✅",
        session: account.session ? "🟨" : "🟪",
        username: account.user?.username || "",
        title: account.title,
      };
    }),
  );

  return [
    `<b>🌐 Accounts Update</b>`,
    "<i>✅ Status: Completed</i>",
    `\n<blockquote><i>Telegram Account updated!</i></blockquote>${users}`,
    `<b>🗓️ Start Date</b>: ${formatDateTime(startDate)}`,
    `<b>🗓️ End Date</b>: ${formatDateTime(endDate)}`,
  ];
}

/** Lines announcing the server's address */
export function serverAddressMessage(address) {
  return [
    `<b>☁️ Latest Fly Server</b>`,
    `<b>🚀 Address</b>: ${address}`,
    `<b>🗓️ Updated</b>: ${formatDateTime()}`,
  ];
}

/** Lines reporting a failed farmer run */
export function farmerErrorMessage(title, accountId, currentTask, errorMessage) {
  return [
    `❌ Error when executing ${title} Farmer for (<b>${accountId}</b>)`,
    `<i>Current Task: ${currentTask || "(none)"}</i>`,
    `<i>${errorMessage}</i>`,
  ];
}
