/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
module.exports = (program, inquirer, chalk) => {
  program
    .command("test-proxies")
    .description("Test Proxies")
    .action(async () => {
      const proxy = require("../lib/proxy");
      const result = await proxy.testProxies();

      const working = result.filter((item) => item.status);
      const failed = result.filter((item) => !item.status);

      console.log(chalk.bold.green("Working Proxies"));
      console.table(working);

      console.log(chalk.bold.red("Failed Proxies"));
      console.table(failed);
    });
};
