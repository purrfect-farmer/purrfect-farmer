import fs from "node:fs";
import path from "node:path";
import { formatDate } from "date-fns";

import { getCurrentPath } from "../lib/path.js";

const { __dirname, __filename } = getCurrentPath(import.meta.url);

/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("export-backup")
    .description("Export Backup")
    .action(async () => {
      const db = await import("../db/models/index.js").then((m) => m.default);
      const GramClient = await import("../lib/GramClient.js").then(
        (m) => m.default
      );

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
