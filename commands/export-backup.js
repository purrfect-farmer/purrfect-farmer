/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
module.exports = (program, inquirer, chalk) => {
  program
    .command("export-backup")
    .description("Export Backup")
    .action(async () => {
      const fs = require("fs");
      const path = require("path");
      const db = require("../db/models");
      const GramClient = require("../lib/GramClient");
      const { formatDate } = require("date-fns");

      const users = await db.User.findAll();
      const accounts = await db.Account.findAll();
      const payments = await db.Payment.findAll();
      const subscriptions = await db.Subscription.findAll();
      const farmers = await db.Farmer.findAll();
      const telegramSessions = await GramClient.getSessions();

      const sessions = [];

      for (const session of telegramSessions) {
        const filePath = GramClient.getSessionPath(session);
        const name = path.basename(filePath);
        const content = fs.readFileSync(filePath, "utf-8");

        sessions.push({
          name,
          content,
        });
      }

      const backupFile = `fly-backup-${formatDate(
        new Date(),
        "yyyyMMdd-HHmmss"
      )}.json`;

      fs.writeFileSync(
        path.join(__dirname, "../backups", backupFile),
        JSON.stringify(
          {
            users,
            accounts,
            payments,
            subscriptions,
            farmers,
            sessions,
          },
          null,
          2
        )
      );

      console.log(chalk.bold.green(`Exported successfully: ${backupFile}`));
    });
};
