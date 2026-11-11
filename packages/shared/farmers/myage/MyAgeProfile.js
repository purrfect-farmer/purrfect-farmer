import FarmerModule from "../../lib/farmer/FarmerModule.js";
import {
  AGE_POINTS,
  PROFILE_MISSING_STATUS,
  PROFILE_PROPAGATION_SECONDS,
} from "./constants.js";

/** The daily rewards for the tag in the Telegram name and the invite link in the bio */
export default class MyAgeProfile extends FarmerModule {
  /** Claim today's name tag reward, adding the tag to the last name when it is missing */
  claimTag() {
    const tag = this.ctx.state.part("tag");

    return this.claimProfileReward({
      label: "Name tag",
      paidToday: tag["paidToday"],
      claim: () => this.ctx.api.claimTag(),
      update: () => {
        const emoji = tag["emoji"];

        /* The drop may lag behind a name that already has the tag */
        if (!emoji || this.core.userFullName().includes(emoji)) {
          return true;
        }

        this.logger.info("Adding the My Age tag to the Telegram name...");

        return this.core.telegram.tryToUpdateProfile({
          lastName: `${this.core.userLastName()} ${emoji}`.trim(),
        });
      },
    });
  }

  /** Claim today's bio reward, setting the invite link as the bio when it is missing */
  claimBio() {
    const invite = this.ctx.state.data?.["invite"];

    return this.claimProfileReward({
      label: "Bio link",
      paidToday: this.ctx.state.part("bio")["paidToday"],
      claim: () => this.ctx.api.claimBio(),
      update: () => {
        if (!invite) return false;

        this.logger.info("Setting the invite link as the Telegram bio...");

        return this.core.telegram.tryToUpdateProfile({ about: invite });
      },
    });
  }

  /** Claim a profile reward, updating the profile once when the drop says it is missing */
  async claimProfileReward({ label, paidToday, claim, update }) {
    if (paidToday) {
      this.logger.info(`${label} reward already claimed today.`);
      return;
    }

    let result = await this.tryToClaim(claim);

    /* A refusal means the profile lacks it: add it, give Telegram time, then claim again */
    if (!result) {
      const updated = await update();

      if (!updated) {
        this.logger.warn(`${label} reward needs a Telegram profile update.`);
        return;
      }

      await this.utils.delayForSeconds(PROFILE_PROPAGATION_SECONDS, {
        signal: this.signal,
      });

      /* The drop reads the name from initData, so reopen the app for one that has it */
      await this.core.telegram.refreshWebApp();

      result = await this.tryToClaim(claim);
    }

    if (!result) {
      this.logger.warn(`${label} reward was refused.`);
      return;
    }

    this.ctx.state.applyBalances(result);
    this.logger.success(
      `Claimed the ${label.toLowerCase()} reward: ${result["reward"]} ${AGE_POINTS}.`,
    );
  }

  /** Claim a profile reward, returning null when the profile does not qualify */
  async tryToClaim(claim) {
    try {
      return await claim();
    } catch (error) {
      if (error.status !== PROFILE_MISSING_STATUS) throw error;

      this.logger.warn(error.message);
      return null;
    }
  }
}
