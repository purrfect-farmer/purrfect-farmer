import { default as chalk } from "chalk";

import { FARMER_STATUS } from "../enums/farmer-status.js";
import { activateFarmers } from "../services/farmer-activation.js";
import db from "../db/models/index.js";

async function unfreezeFarmers() {
  try {
    /** A null frozenUntil is an indefinite freeze, so it is left alone */
    const affectedCount = await activateFarmers({
      status: FARMER_STATUS.FROZEN,
      frozenUntil: {
        [db.Sequelize.Op.ne]: null,
        [db.Sequelize.Op.lte]: new Date(),
      },
    });

    console.log(chalk.bold.green(`Unfroze ${affectedCount} farmer(s)!`));
  } catch (error) {
    console.error("Failed to unfreeze farmers:", error);
  }
}

export default unfreezeFarmers;
