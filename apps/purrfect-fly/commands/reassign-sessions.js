import { getCurrentPath } from "../lib/path.js";

const { __dirname, __filename } = getCurrentPath(import.meta.url);

/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("reassign-sessions")
    .description("Reassign Telegram Sessions")
    .action(async () => {
      const db = await import("../db/models/index.js").then((m) => m.default);
      const GramClient = await import("../lib/GramClient.js").then(
        (m) => m.default
      );

      const sessions = await GramClient.getSessions();
      const assigned = new Set();

      console.log(chalk.yellow.bold(`Found sessions: ${sessions.length}`));
      console.table(sessions);

      for (const session of sessions) {
        try {
          console.log(chalk.blue(`Processing session: "${session}"`));
          const client = await GramClient.create(session);
          const user = await client.getSelf();
          const userId = user?.id?.toString();

          console.log(chalk.gray(`User ID: ${userId || "N/A"}`));

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
