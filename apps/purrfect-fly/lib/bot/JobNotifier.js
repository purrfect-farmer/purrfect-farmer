import app from "../../config/app.js";
import defaultBot from "../bot.js";
import { formatDateTime } from "../format-date-time.js";
import logger from "../logger.js";

/** Progress messages carry no link previews */
const SEND_OPTIONS = {
  ["link_preview_options"]: { ["is_disabled"]: true },
};

/** Reports a long server job one step at a time to the admin, the operations thread and its operator */
export default class JobNotifier {
  /**
   * @param {object} options
   * @param {string} options.title Heading of every message, e.g. "📥 Whiskers Import"
   * @param {number} options.total Steps the job will report
   * @param {string|number} [options.operatorId] Telegram id of whoever started the job
   */
  constructor({ title, total, operatorId = null, bot = defaultBot }) {
    this.title = title;
    this.total = total;
    this.operatorId = operatorId;
    this.bot = bot;
    this.done = 0;
    this.startDate = new Date();

    /** Messages are sent one after another without holding up the job */
    this.chain = Promise.resolve();
  }

  /** Whether the operator would only get a second copy of the admin's message */
  get operatorIsAdmin() {
    return String(this.operatorId) === String(app.admin.telegramId);
  }

  /** Queue a message for every recipient */
  send(lines) {
    const messages = [`<b>${this.title}</b>`, ...lines];

    this.chain = this.chain
      .then(() => this.deliver(messages))
      .catch((error) => logger.error("Job notification failed:", error));

    return this.chain;
  }

  /** Send one message to the admin, the operations thread and the operator */
  deliver(messages) {
    const sendToOperator = this.operatorId && !this.operatorIsAdmin;

    return Promise.all([
      this.bot?.sendAdminMessage(messages, SEND_OPTIONS),
      this.bot?.sendOperationMessage(messages, SEND_OPTIONS),
      sendToOperator
        ? this.bot?.sendUserMessage(this.operatorId, messages, SEND_OPTIONS)
        : null,
    ]);
  }

  /** Announce the job */
  start(lines = []) {
    return this.send([
      `<i>⏳ Status: Started</i>\n`,
      ...lines,
      `<b>Total</b>: ${this.total}`,
    ]);
  }

  /** Report one finished step with its position */
  step({ icon, label, lines = [] }) {
    this.done++;

    return this.send([
      `<i>${icon} ${label}</i>\n`,
      ...lines,
      `\n<b>Progress</b>: ${this.done}/${this.total}`,
    ]);
  }

  /** Report the end of the job, resolving once every message is out */
  complete(lines = []) {
    return this.send([
      `<i>✅ Status: Completed</i>\n`,
      ...lines,
      `\n<b>🗓️ Start</b>: ${formatDateTime(this.startDate)}`,
      `<b>🗓️ End</b>: ${formatDateTime(new Date())}`,
    ]);
  }

  /** Resolve once every queued message is out */
  flush() {
    return this.chain;
  }

  /** Report a job that stopped early */
  fail(reason) {
    return this.send([`<i>❌ Status: Failed</i>\n`, reason]);
  }
}
