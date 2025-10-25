import { getCurrentPath } from "../lib/path.js";

const { __dirname, __filename } = getCurrentPath(import.meta.url);

/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("update-account-proxies")
    .description("Update Account Proxies")
    .action(async () => {
      await import("../actions/update-proxies.js").then((m) => m.default());

      console.log(chalk.bold.green("Account Proxies Updated!"));
    });
};
