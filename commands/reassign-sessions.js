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
      const sessions = await GramClient.getSessions();
      const db = require("../db/models");

      let count = 0;

      for (const session of sessions) {
        const client = await GramClient.create(session);
        const user = await client.getSelf();

        if (user) {
          await client.destroy();
          await db.Account.update(
            { session },
            {
              where: {
                id: user.id,
              },
            }
          );
          count++;
        } else {
          await client.logout();
        }
      }

      console.log(chalk.green.bold(`Reassigned sessions: ${count}`));
    });
};
