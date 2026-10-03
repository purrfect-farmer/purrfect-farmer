import logger from "../../logger.js";

/** One thing an Auto run does, with the context and its collaborators to hand */
class AutoOperation {
  /** @param {import("../AutoContext.js").default} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  get fmt() {
    return this.ctx.fmt;
  }

  get notify() {
    return this.ctx.notify;
  }

  get options() {
    return this.ctx.options;
  }

  get title() {
    return this.ctx.title;
  }

  get token() {
    return this.ctx.token;
  }

  /** The unit the drop keeps its own balance in */
  get currency() {
    return this.ctx.currency;
  }

  /** Is Last Account */
  isLastAccount(index) {
    return index === this.ctx.accounts.length - 1;
  }

  /** Run the operation, turning an error into a message rather than a rejection
   * @param {string} phrase - completes "an error occurred ...", e.g. "during collection"
   * @param {() => Promise<any>} run
   */
  async guard(phrase, run) {
    try {
      return await run();
    } catch (e) {
      const errorMessage = e.message || "Unknown error!";

      logger.error(errorMessage);

      await this.notify.send([
        `❌ ${this.title} - an error occurred ${phrase}!`,
        errorMessage,
      ]);
    }
  }

  /** Process every account in turn until cancelled, collecting what each returns
   * @param {(account: object, index: number) => Promise<object | undefined>} process
   */
  async processAccounts(process) {
    const results = [];

    for (const [index, account] of this.ctx.accounts.entries()) {
      if (this.ctx.aborted) break;

      try {
        const result = await process(account, index);

        /** Accounts without a cloud account yield none */
        if (result) results.push(result);
      } catch (e) {
        /** Cancellation, not a failure: report what was done */
        if (this.ctx.aborted) break;
        throw e;
      }
    }

    return results;
  }

  /** Say the run completed, or that it stopped early */
  sendCompletion(completed) {
    return this.ctx.aborted
      ? this.notify.sendCancellationCompletion()
      : this.notify.send([completed]);
  }

  /** The shape every one-pass batch operation shares
   * @param {object} params
   * @param {string[]} params.intro - the initiation message
   * @param {() => Promise<void>} [params.prepare] - run before the first account
   * @param {(account: object, index: number) => Promise<object | undefined>} params.process
   * @param {string} params.completed - the completion message
   * @param {(results: object[]) => Promise<void>} params.summarize - the summary message
   * @param {string} params.errorPhrase - completes "an error occurred ..."
   */
  runBatch({ intro, prepare, process, completed, summarize, errorPhrase }) {
    return this.guard(errorPhrase, async () => {
      await this.notify.send(intro);

      if (prepare) await prepare();

      const results = await this.processAccounts(process);

      await this.sendCompletion(completed);

      await summarize(results);
    });
  }
}

export default AutoOperation;
