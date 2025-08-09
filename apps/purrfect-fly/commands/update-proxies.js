import proxy from "../lib/proxy.js";

/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("update-proxies")
    .description("Update Proxies")
    .action(async () => {
      const list = await proxy.updateList();

      console.log(chalk.bold.green("List Updated!"));
      console.table(list);
    });
};
