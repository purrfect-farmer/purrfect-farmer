/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
module.exports = (program, inquirer, chalk) => {
  program
    .command("update-proxies")
    .description("Update Proxies")
    .action(async () => {
      const proxy = require("../lib/proxy");
      const list = await proxy.updateList();

      console.log(chalk.bold.green("List Updated!"));
      console.table(list);
    });
};
