import { default as chalk } from "chalk";

import db from "../db/models/index.js";

async function expireSubscriptions() {
  try {
    await db.Subscription.update(
      { active: false },
      {
        where: {
          endsAt: { [db.Sequelize.Op.lt]: new Date() },
        },
      }
    );

    console.log(chalk.bold.green("Subscriptions successfully expired!"));
  } catch (error) {
    console.error("Failed to expire subscriptions:", error);
  }
}

export default expireSubscriptions;
