/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
module.exports = (program, inquirer, chalk) => {
  program
    .command("update-account-proxies")
    .description("Update Account Proxies")
    .action(async () => {
      const updateAccountProxies = require("../actions/updateProxies");

      await updateAccountProxies();

      console.log(chalk.bold.green("Account Proxies Updated!"));
    });
};
