const { default: chalk } = require("chalk");
const db = require("../db/models");

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
    console.error("Failed to expire subscriptions:", error.message);
  }
}

module.exports = expireSubscriptions;
