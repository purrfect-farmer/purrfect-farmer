/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
module.exports = (program, inquirer, chalk) => {
  program
    .command("update-accounts")
    .description("Update Accounts")
    .action(async () => {
      const updateAccounts = require("../actions/updateAccounts");

      await updateAccounts();

      console.log(chalk.bold.green("Accounts Updated!"));
    });
};
