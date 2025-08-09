import proxy from "../lib/proxy.js";
import { getCurrentPath } from "../lib/path.js";

const { __dirname, __filename } = getCurrentPath(import.meta.url);

/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("test-proxies")
    .description("Test Proxies")
    .action(async () => {
      const result = await proxy.testProxies();

      const working = result.filter((item) => item.status);
      const failed = result.filter((item) => !item.status);

      console.log(chalk.bold.green("Working Proxies"));
      console.table(working);

      console.log(chalk.bold.red("Failed Proxies"));
      console.table(failed);
    });
};
