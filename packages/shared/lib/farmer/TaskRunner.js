/** Runs a farmer's tasks one at a time, logging each and keeping what is running for status reports */
export default class TaskRunner {
  /**
   * @param {object} options
   * @param {ReturnType<import("./createFarmerCore.js").default>} options.core
   * @param {() => boolean} options.quickRun - whether tasks marked as slow are skipped
   */
  constructor({ core, quickRun }) {
    this.core = core;
    this.quickRun = quickRun;

    this.startedAt = new Date();
    this.currentTaskStartedAt = null;
    this.currentTask = null;
  }

  /** How long the current task has been running, in words */
  elapsed() {
    return this.core.utils.dateFns.formatDistanceToNowStrict(
      this.currentTaskStartedAt || new Date(),
    );
  }

  /** Execute a task with logging */
  async execute(task, callback, allowInQuickRun = true) {
    const { logger, utils } = this.core;

    /** Update Task */
    this.currentTaskStartedAt = new Date();
    this.currentTask = task;

    /* Add newline */
    logger.newline();

    /* Check Aborted */
    if (this.core.signal?.aborted) {
      logger.warn(`✖ Task aborted: ${logger.c.magenta(task)}`);
      return;
    }

    /* Check Quick Run */
    if (this.quickRun() && !allowInQuickRun) {
      logger.log(
        `${logger.c.yellow("⚡ Skipping in quick run:")} ${logger.c.magenta(task)}`,
      );
      return;
    }

    try {
      logger.log(
        `${logger.c.gray("⚙ Executing task:")} ${logger.c.magenta(task)}`,
      );

      /** Delay before processing task */
      await utils.delayForSeconds(5, { signal: this.core.signal });

      await callback();

      logger.log(
        `${logger.c.green("✔ Completed task:")} ${logger.c.magenta(task)}`,
      );
    } catch (error) {
      logger.log(
        `${logger.c.red("✖ Error executing task:")} ${logger.c.magenta(
          task,
        )}\n   ${logger.c.gray(error.message)}`,
      );
      throw error;
    } finally {
      /** Delay before processing next task */
      await utils.delayForSeconds(5, { signal: this.core.signal });
    }
  }
}
