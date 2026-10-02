import { MAX_CONCURRENT_ACCOUNTS } from "./config.js";

/** Runs prepared instances, refilling each freed slot up to MAX_CONCURRENT_ACCOUNTS */
export default class RunnerQueue {
  /** Instances waiting to run */
  items = [];

  /** Whether the processing loop is running */
  isProcessing = false;

  constructor(Runner) {
    this.Runner = Runner;
  }

  /** Add an instance to the queue */
  push(instance) {
    this.items.push(instance);
  }

  /** Process queue */
  async process() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    /** In-flight items, keyed by their promise */
    const active = new Map();

    /** Launches so far, used for the initial ramp-up */
    let launched = 0;

    try {
      while (this.items.length > 0 || active.size > 0) {
        /** Fill every free slot */
        while (active.size < MAX_CONCURRENT_ACCOUNTS) {
          const item = this.dequeue(active);

          /** Nothing runnable right now */
          if (!item) break;

          /** Stagger only the initial ramp-up, then refill instantly */
          const staggerSeconds =
            item.exclusive || launched >= MAX_CONCURRENT_ACCOUNTS
              ? 0
              : launched * (item.instance.account.farmer ? 20 : 60);

          /** Launch and free the slot once it settles */
          const promise = this.processItem(item, staggerSeconds)
            .catch(() => {})
            .finally(() => active.delete(promise));

          active.set(promise, item);

          /** The exclusive primary launch does not consume the ramp-up */
          if (!item.exclusive) {
            launched += 1;
          }
        }

        /** Guard against a stalled queue */
        if (active.size === 0) break;

        /** One completion frees one slot */
        await Promise.race(active.keys());
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /** Pick the next runnable item, or null when nothing may start yet
   * @param {Map} active
   */
  dequeue(active) {
    const Runner = this.Runner;

    if (this.items.length === 0) return null;

    /** Prioritize primary account if the primary link is not set */
    if (!Runner.primaryLink.link) {
      /** Hold everything back while the primary account runs */
      if (Array.from(active.values()).some((item) => item.exclusive)) {
        return null;
      }

      const primary = this.items.find(
        (item) => item.account.id === Runner.primaryAccountId,
      );

      if (primary) {
        /** The primary account runs alone until the link resolves */
        if (active.size > 0) return null;

        /** Log */
        Runner.logger.info(
          "Prioritizing primary account:",
          Runner.primaryAccountId,
        );

        return this.take(primary, true);
      }
    }

    /** Process one new account at a time */
    const hasNewAccount = Array.from(active.values()).some(
      (item) => !item.instance.account.farmer,
    );

    const instance = hasNewAccount
      ? this.items.find((item) => item.account.farmer)
      : this.items.find((item) => !item.account.farmer) ||
        this.items.find((item) => item.account.farmer);

    return instance ? this.take(instance) : null;
  }

  /** Remove an instance from the queue and wrap it as a queue item */
  take(instance, exclusive = false) {
    this.items.splice(this.items.indexOf(instance), 1);

    return {
      instance,
      exclusive,
      skipExecution:
        !instance.account.farmer && this.Runner.skipExecutionOfNewAccount,
    };
  }

  /** Process queue item */
  async processItem({ instance, skipExecution = false }, staggerSeconds = 0) {
    const Runner = this.Runner;

    try {
      /** Stagger the launch: an account terminated while waiting skips its turn */
      if (staggerSeconds > 0) {
        await Runner.utils.delayForSeconds(staggerSeconds, {
          signal: instance.signal,
        });
      }

      await Runner.execute(instance, skipExecution);
    } catch (err) {
      if (instance.signal.aborted) {
        /** Terminated before its turn came up */
        Runner.logger.info("Skipped terminated account:", instance.account.id);
      } else {
        /** Log error */
        Runner.logger.error("Queue processing error:", err);

        /** Unblock queue */
        Runner.primaryLink.reset(instance);
      }
    } finally {
      /** Delete instance */
      Runner.runners.delete(instance.account.id);
    }
  }
}
