import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import { LAUNCH_QUIZ_ANSWER } from "./constants.js";

/** The launch campaign beside the task list, whose quiz pays out */
export default class DiggoLaunchTasks extends FarmerModule {
  /** Whether the campaign's quiz can still be answered */
  isQuizOpen(campaign) {
    const now = Number(campaign["serverNow"]) || this.ctx.state.getServerNow();

    return (
      Boolean(campaign["enabled"]) &&
      !campaign["quiz"]?.["claimed"] &&
      now >= Number(campaign["startsAt"]) &&
      now < Number(campaign["quizEndsAt"])
    );
  }

  /** Open the campaign's post, then answer its quiz for the reward */
  async completeQuiz() {
    const campaign = await this.ctx.api.fetchLaunchTasks();

    if (!this.isQuizOpen(campaign)) {
      this.logger.info("No launch quiz to answer.");
      return;
    }

    await this.core.telegram.openTaskLink(campaign["postUrl"]);

    const result = await this.ctx.api.answerLaunchQuiz(LAUNCH_QUIZ_ANSWER);

    if (result["amount"] > 0 && !result["replayed"]) {
      this.logger.success(
        `Answered the launch quiz for ${formatAmount(result["amount"])} DIGGO.`,
      );
    } else {
      this.logger.info("The launch quiz was already answered.");
    }
  }
}
