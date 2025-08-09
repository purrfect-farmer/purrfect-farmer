import updateAccounts from "../actions/updateAccounts.js";
import { getCurrentPath } from "../lib/path.js";

const { __dirname, __filename } = getCurrentPath(import.meta.url);
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
      await updateAccounts();

      console.log(chalk.bold.green("Accounts Updated!"));
    });
};
