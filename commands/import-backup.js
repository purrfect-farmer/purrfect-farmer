/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
module.exports = (program, inquirer, chalk) => {
  program
    .command("import-backup <file>")
    .description("Import Backup")
    .usage("import-backup fly-backup.json")
    .action(async (file) => {
      const fs = require("fs");
      const db = require("../db/models");

      const backup = JSON.parse(fs.readFileSync(file, "utf-8"));

      await db.Account.bulkCreate(backup.accounts, { ignoreDuplicates: true });
      await db.Payment.bulkCreate(backup.payments, { ignoreDuplicates: true });
      await db.Subscription.bulkCreate(backup.subscriptions, {
        ignoreDuplicates: true,
      });
      await db.Farmer.bulkCreate(backup.farmers, { ignoreDuplicates: true });

      console.log(chalk.bold.green("Imported successfully!"));
    });
};
