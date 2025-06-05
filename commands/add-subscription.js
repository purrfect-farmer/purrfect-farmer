/**
 *
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer")} inquirer
 */
module.exports = (program, inquirer) => {
  program
    .command("add-subscription [user] [date]")
    .description("Adds a subscription")
    .usage("12345678 2030-01-01")
    .action(async (userId, endDate) => {
      const dateFns = require("date-fns");
      const db = require("../db/models");

      if (!userId) {
        const answers = await inquirer.prompt([
          { name: "userId", message: "Telegram User ID:" },
          { name: "endDate", message: "End Date (Optional):" },
        ]);

        userId = answers.userId;
        endDate = answers.endDate;
      }

      const [account] = await db.Account.findOrCreate({
        where: {
          id: userId,
        },
        include: [
          {
            required: false,
            association: "subscriptions",
            where: {
              status: "active",
            },
          },
        ],
      });

      if (account.subscription) {
        await account.subscription.update({
          endsAt: endDate
            ? new Date(endDate)
            : dateFns.addDays(new Date(account.subscription.endsAt), 30),
        });
      } else {
        await account.createSubscription({
          status: "active",
          startsAt: new Date(),
          endsAt: endDate ? new Date(endDate) : dateFns.addDays(new Date(), 30),
        });
      }

      console.log("Subscription Updated!");
    });
};
