const { default: chalk } = require("chalk");
const ProxyProvider = require("../lib/ProxyProvider");

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
      const proxy = new ProxyProvider();
      const list = await proxy.updateList();

      console.log(chalk.bold.green("List Updated!"));
      console.table(list);
    });
};
