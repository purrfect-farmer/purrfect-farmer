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
      const assigned = [];

      for (const session of sessions) {
        const client = await GramClient.create(session);
        const user = await client.getSelf();

        if (!user || assigned.includes(user.id)) {
          await client.logout();
          continue;
        }

        const account = await db.Account.findByPk(user.id);

        if (!account) {
          await client.logout();
          continue;
        }

        await client.destroy();
        await account.update({ session });
        assigned.push(user.id);
      }

      console.log(chalk.green.bold(`Reassigned sessions: ${assigned.length}`));
    });
};
