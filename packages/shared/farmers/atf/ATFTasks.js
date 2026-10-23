import {
  BIO_TASK,
  COOLDOWN_TASKS,
  NAME_EYE_TASK,
  ONE_TIME_TASKS,
  PROFILE_PROPAGATION_SECONDS,
} from "./constants.js";
import ATFMining from "./ATFMining.js";

/** One-time, cooldown, profile and referral tasks */
export default class ATFTasks extends ATFMining {
  async completeTasks() {
    /** Record Navigation Batch */
    await this.recordNavigationBatch(1);

    const { user } = this.user_data;
    const completedTasks = user.completed_tasks || [];

    const availableTasks = ONE_TIME_TASKS.filter(
      (task) => !completedTasks.includes(task.id),
    );

    /** Complete Available Tasks */
    for (const task of availableTasks) {
      if (this.signal.aborted) break;

      try {
        /** Telegram joins are checked by the bot */
        if (task.link) {
          await this.tryToJoinTelegramLink(task.link);
        }

        const result = await this.claimTask(task.id, 0);

        if (result.status !== "success") {
          this.logger.error(`Failed to claim ${task.id}:`, result.message);
        } else {
          this.applyClaimResult(result);
          completedTasks.push(task.id);
          this.logger.success(`Claimed task: ${task.id}`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to claim ${task.id}:`,
          error.response?.data?.message || error.message,
        );
      }

      await this.utils.delayForSeconds(20, { signal: this.signal });
    }
  }

  /** Complete Extra Tasks, each on its own cooldown */
  async completeExtraTasks() {
    const cooldowns = this.user_data["task_cooldowns"] || {};
    const nowSec = Math.floor(Date.now() / 1000);

    const availableTasks = COOLDOWN_TASKS.filter(
      (task) => !(Number(cooldowns[task.id]) > nowSec),
    );

    if (availableTasks.length === 0) {
      this.logger.warn("Extra tasks not available");
      return;
    }

    /** Record Navigation Batch */
    await this.recordNavigationBatch(1);

    for (const task of availableTasks) {
      if (this.signal.aborted) break;

      try {
        /** The claim is checked against the start the app registered */
        const startedAt = Math.floor(Date.now() / 1000);

        await this.startTask(task.id, startedAt);
        await this.utils.delayForSeconds(
          task.minSeconds + 5 + Math.floor(Math.random() * 15),
          { signal: this.signal },
        );

        const result = await this.claimTask(task.id, startedAt);

        if (result.status !== "success") {
          this.logger.error(`Failed to complete ${task.id}:`, result.message);
        } else {
          this.applyClaimResult(result);
          this.logger.success(`Completed task: ${task.id}`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to complete ${task.id}:`,
          error.response?.data?.message || error.message,
        );
      }

      await this.utils.delayForSeconds(10, { signal: this.signal });
    }
  }

  /** The drop can refuse a profile task claim with a 4xx body carrying the reason */
  async makeProfileTaskClaim(claim) {
    try {
      return await claim();
    } catch (error) {
      if (!error.response?.data) {
        throw error;
      }
      return error.response.data;
    }
  }

  /** Record when a profile task is next available */
  setProfileTaskCooldown(id, result) {
    const nextAvailable = Number(result?.["next_available"]) || 0;

    this.user_data["task_cooldowns"] = {
      ...this.user_data["task_cooldowns"],
      [id]: nextAvailable,
    };

    return nextAvailable;
  }

  /** Complete a repeatable task verified against the Telegram profile, updating it when missing */
  async completeProfileTask({
    id,
    label,
    getStatus,
    claim,
    missingReason,
    update,
  }) {
    const nowSec = Math.floor(Date.now() / 1000);
    const cooldowns = this.user_data["task_cooldowns"] || {};

    if (Number(cooldowns[id]) > nowSec) {
      this.logger.warn(`${label} task not available`);
      return;
    }

    const status = await getStatus();

    if (
      status?.["status"] === "success" &&
      this.setProfileTaskCooldown(id, status) > nowSec
    ) {
      this.logger.warn(`${label} task not available`);
      return;
    }

    let result = await this.makeProfileTaskClaim(claim);

    if (result?.["reason"] === missingReason) {
      const updated = await update();

      if (!updated) {
        this.logger.warn(`${label} task needs a Telegram profile update`);
        return;
      }

      await this.utils.delayForSeconds(PROFILE_PROPAGATION_SECONDS, {
        signal: this.signal,
      });

      result = await this.makeProfileTaskClaim(claim);
    }

    if (result?.["status"] === "success") {
      this.applyClaimResult(result);
      this.setProfileTaskCooldown(id, result);
      this.logger.success(`Completed task: ${id}`);
      return;
    }

    if (result?.["reason"] === "cooldown") {
      this.setProfileTaskCooldown(id, result);
      this.logger.warn(`${label} task is on cooldown`);
      return;
    }

    this.logger.error(
      `Failed to complete ${id}:`,
      result?.["message"] || result?.["reason"] || "Unknown error",
    );
  }

  /** Complete Bio Task, setting the channel link as the bio when it is missing */
  completeBioTask() {
    return this.completeProfileTask({
      id: BIO_TASK.id,
      label: "Bio",
      getStatus: () => this.getBioTaskStatus(),
      claim: () => this.claimBioTask(),
      missingReason: "bio_missing",
      update: () => {
        this.logger.info("Setting the ATF channel as Telegram bio...");
        return this.tryToUpdateProfile({ about: BIO_TASK.bio });
      },
    });
  }

  /** Complete Name Eye Task, appending the eye emoji to the last name when it is missing */
  completeNameEyeTask() {
    return this.completeProfileTask({
      id: NAME_EYE_TASK.id,
      label: "Name Eye",
      getStatus: () => this.getNameEyeTaskStatus(),
      claim: () => this.claimNameEyeTask(),
      missingReason: "name_eye_missing",
      update: () => {
        const lastName = this.getUserLastName();

        /* The verifier may lag behind a name that already has the eye */
        if (this.getUserFullName().includes(NAME_EYE_TASK.emoji)) {
          return true;
        }

        this.logger.info("Adding the eye emoji to Telegram name...");
        return this.tryToUpdateProfile({
          lastName: `${lastName} ${NAME_EYE_TASK.emoji}`.trim(),
        });
      },
    });
  }

  /** Claim Friends Rewards */
  async claimFriendsRewards() {
    /** Record Navigation Batch */
    await this.recordNavigationBatch(1);

    const friends = await this.getFriends();
    const claimable = friends.claimable;
    const teamWallet = friends.team_wallet;

    if (claimable > 0) {
      const result = await this.claimReferrals();

      this.applyClaimResult(result);

      /** claimable counts friends, each worth reward_per */
      const claimed =
        (Number(result?.["claimed_count"]) || claimable) *
        (Number(friends.reward_per) || 100);

      this.logger.success(`Claimed ${claimed} ATF from referrals!`);
      await this.utils.delayForSeconds(2, { signal: this.signal });
    } else {
      this.logger.info("No referral rewards to claim.");
    }

    if (teamWallet > 0) {
      /** Only the pool balance comes back, the level is left as it was */
      const result = await this.claimTeamWallet();

      this.applyClaimResult(result, "new_pool_balance");

      this.logger.success(
        `Claimed ${result.claimed_amount ?? teamWallet} ATF from team wallet!`,
      );
      await this.utils.delayForSeconds(2, { signal: this.signal });
    } else {
      this.logger.info("No team wallet rewards to claim.");
    }
  }

  /** Get Referrals Count */
  async getReferralsCount() {
    const friends = await this.getFriends();
    return friends.total || 0;
  }
}
