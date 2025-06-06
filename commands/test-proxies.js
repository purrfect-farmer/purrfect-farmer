const { default: chalk } = require("chalk");
const ProxyProvider = require("../lib/ProxyProvider");

/**
 *
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 */
module.exports = (program, inquirer) => {
  program
    .command("test-proxies")
    .description("Test Proxies")
    .action(async () => {
      const proxy = new ProxyProvider();
      const result = await proxy.testProxies();

      const working = result.filter((item) => item.status);
      const failed = result.filter((item) => !item.status);

      console.log(chalk.bold.green("Working Proxies"));
      console.table(working);

      console.log(chalk.bold.red("Failed Proxies"));
      console.table(failed);
    });
};
