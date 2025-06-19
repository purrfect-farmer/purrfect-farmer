/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
module.exports = (program, inquirer, chalk) => {
  program
    .command("list-accounts")
    .description("List Accounts")
    .action(async () => {
      const db = require("../db/models");
      const accounts = await db.Account.findAll();

      console.log(chalk.bold.green(`Accounts (${accounts.length})`));
      console.table(
        accounts
          .sort((a, b) => {
            return a["title"].localeCompare(b["title"]);
          })
          .map((account) => ({
            id: account.id,
            title: account.title,
            session: account.session,
            proxy: account.proxy,
          }))
      );
    });
};
