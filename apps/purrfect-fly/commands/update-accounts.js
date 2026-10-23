/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("update-accounts")
    .description("Update Accounts")
    .action(async () => {
      await import("../actions/update-accounts.js").then((m) => m.default());

      console.log(chalk.bold.green("Accounts Updated!"));
    });
};
