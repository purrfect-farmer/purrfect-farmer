import { getCurrentPath } from "../lib/path.js";

const { __dirname, __filename } = getCurrentPath(import.meta.url);
/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("list-accounts")
    .description("List Accounts")
    .action(async () => {
      const db = await import("../db/models/index.js").then((m) => m.default);
      const accounts = await db.Account.findAll();

      console.log(chalk.bold.green(`Accounts (${accounts.length})`));
      console.table(
        accounts
          .sort((a, b) => {
            return a["title"].localeCompare(b["title"]);
          })
          .map((account) => ({
            id: account.id,
            title: account.title,
            session: account.session,
            proxy: account.proxy,
          }))
      );
    });
};
