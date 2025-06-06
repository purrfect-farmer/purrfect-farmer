const { default: chalk } = require("chalk");
const proxy = require("../lib/proxy");

/**
 *
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 */
module.exports = (program, inquirer) => {
  program
    .command("update-proxies")
    .description("Update Proxies")
    .action(async () => {
      const list = await proxy.updateList();

      console.log(chalk.bold.green("List Updated!"));
      console.table(list);
    });
};
