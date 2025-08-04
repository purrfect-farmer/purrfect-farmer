/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
module.exports = (program, inquirer, chalk) => {
  program
    .command("reassign-sessions")
    .description("Reassign Telegram Sessions")
    .action(async () => {
      const GramClient = require("../lib/GramClient");
      const db = require("../db/models");

      const sessions = await GramClient.getSessions();
      const assigned = new Set();

      for (const session of sessions) {
        try {
          const client = await GramClient.create(session);
          const user = await client.getSelf();
          const userId = user?.id?.toString();

          if (!userId || assigned.has(userId)) {
            await client.logout();
            continue;
          }

          const account = await db.Account.findByPk(userId);

          if (!account) {
            await client.logout();
            continue;
          }

          await client.destroy();
          await account.update({ session });
          assigned.add(userId);
        } catch (error) {
          console.error(
            chalk.red(`Error processing session "${session}":`),
            error
          );
        }
      }

      console.log(chalk.green.bold(`Reassigned sessions: ${assigned.size}`));
    });
};
