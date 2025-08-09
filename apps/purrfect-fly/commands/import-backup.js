import fs from "node:fs";
import path from "node:path";
import { getCurrentPath } from "../lib/path.js";

const { __dirname, __filename } = getCurrentPath(import.meta.url);

/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("import-backup <file>")
    .description("Import Backup")
    .usage("/path/to/fly-backup.json")
    .action(async (file) => {
      const db = await import("../db/models/index.js").then((m) => m.default);
      const backup = JSON.parse(fs.readFileSync(file, "utf-8"));

      await db.User.bulkCreate(backup.users, { ignoreDuplicates: true });
      await db.Account.bulkCreate(backup.accounts, { ignoreDuplicates: true });
      await db.Payment.bulkCreate(backup.payments, { ignoreDuplicates: true });
      await db.Subscription.bulkCreate(backup.subscriptions, {
        ignoreDuplicates: true,
      });
      await db.Farmer.bulkCreate(backup.farmers, { ignoreDuplicates: true });

      /** Restore Sessions */
      backup.sessions.forEach((session) => {
        fs.writeFileSync(
          path.resolve(__dirname, "../sessions", session.name),
          session.content
        );
      });

      console.log(chalk.bold.green("Imported successfully!"));
    });
};
