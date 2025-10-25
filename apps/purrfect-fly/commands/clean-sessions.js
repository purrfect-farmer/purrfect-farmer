import { getCurrentPath } from "../lib/path.js";
import fsp from "node:fs/promises";

const { __dirname, __filename } = getCurrentPath(import.meta.url);

/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("clean-sessions")
    .description("Clean Telegram Sessions")
    .action(async () => {
      const db = await import("../db/models/index.js").then((m) => m.default);
      const GramClient = await import("../lib/GramClient.js").then(
        (m) => m.default
      );

      const sessions = await GramClient.getSessions();
      const accounts = await db.Account.findAll();

      console.log(chalk.yellow.bold(`Found sessions: ${sessions.length}`));
      console.table(sessions);

      const usedSessions = accounts.map((account) => account.session);
      const unusedSessions = sessions.filter(
        (session) => !usedSessions.includes(session)
      );

      console.log(
        chalk.yellow.bold(`Found unused sessions: ${unusedSessions.length}`)
      );
      console.table(unusedSessions);

      for (const session of unusedSessions) {
        const sessionPath = GramClient.getSessionPath(session);
        await fsp.unlink(sessionPath);
        console.log(chalk.green.bold(`Deleted session file: ${sessionPath}`));
      }

      console.log(chalk.bold.green("Session cleanup completed!"));
    });
};
