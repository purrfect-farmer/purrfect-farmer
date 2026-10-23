/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("add-subscription [user] [date]")
    .description("Adds a subscription")
    .usage("12345678 2030-01-01")
    .action(async (userId, endDate) => {
      const { subscribeAccount } = await import("../services/subscriptions.js");

      if (!userId) {
        const answers = await inquirer.prompt([
          { name: "userId", message: "Telegram User ID:", required: true },
          { name: "endDate", message: "End Date (Optional):" },
        ]);

        userId = answers.userId;
        endDate = answers.endDate;
      }

      await subscribeAccount(userId, endDate);

      console.log("Subscription Updated!");
    });
};
