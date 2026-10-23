import selectAccounts, { assignUnusedProxies } from "./selectAccounts.js";

import { RUNNER_RESULT } from "../../enums/runner-result.js";
import bot from "../../lib/bot.js";
import db from "../../db/models/index.js";

/** Where a prepared account's run currently stands */
export function getRunResult(Runner, account) {
  const instance = Runner.runners.get(account.id);
  if (!instance) {
    return { status: RUNNER_RESULT.SKIPPED };
  }

  return {
    status: instance.currentTask
      ? RUNNER_RESULT.RUNNING
      : RUNNER_RESULT.STARTED,
    startedAt: instance.startedAt,
    currentTaskStartedAt: instance.currentTaskStartedAt,
    currentTask: instance.currentTask,
    elapsed: instance.getElapsedTime(),
  };
}

/** Warn when the primary account is left out of a full run */
async function checkPrimaryAccount(Runner, primaryAccount, accountsWithFarmer) {
  if (primaryAccount) {
    Runner.primaryLink.warning = null;
    return;
  }

  await Runner.primaryLink.notifyMissing(
    await Runner.primaryLink.getMissingReason(accountsWithFarmer),
  );
}

/** Report which accounts the run started */
async function notifyRunStarted(Runner, accountsWithFarmer, executable) {
  const results = executable.map((account) => {
    return { account, result: Runner.getResult(account) };
  });

  try {
    await bot?.sendFarmingInitiatedMessage({
      id: Runner.id,
      title: `${Runner.emoji} ${Runner.title}`,
      link: Runner.link,
      telegramLink: Runner.telegramLink,
      threadId: Runner.threadId,
      totalCount: accountsWithFarmer.length,
      executedCount: executable.length,
      results,
    });
  } catch (error) {
    Runner.logger.error("Failed to send farming notification:", error);
  }
}

/** Queue every runnable subscribed account, or only `user` */
export async function runFarmer(Runner, { user } = {}) {
  try {
    const accountsWithFarmer = await db.Account.findSubscribedWithFarmer(
      Runner.id,
    );

    /** Resolve the stored primary link before anything launches */
    await Runner.primaryLink.resolveFromDatabase();

    const { primaryAccount, executable, skipped } = selectAccounts({
      accounts: accountsWithFarmer,
      user,
      terminated: Runner.terminated,
      primaryAccountId: Runner.primaryAccountId,
      platform: Runner.platform,
      autoStart: Runner.autoStart,
      referrerMode: Runner.referrerMode,
      primaryLinkResolved: Runner.primaryLink.resolved,
    });

    /** A single-user run never includes the primary account */
    if (!user) {
      await checkPrimaryAccount(Runner, primaryAccount, accountsWithFarmer);
    }

    assignUnusedProxies(executable, skipped);

    Runner.utils
      .shuffle(executable)
      .forEach((account) => Runner.prepare(account, true));

    Runner.runQueue.process();

    await notifyRunStarted(Runner, accountsWithFarmer, executable);
  } catch (error) {
    Runner.logger.error("Error during run:", error);
  } finally {
    Runner.logger.success(`> ${Runner.title} Farmer Initiated`);
  }
}
