/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("activate-all-farmers")
    .description("Activate all farmers")
    .action(async () => {
      const db = await import("../db/models/index.js").then((m) => m.default);
      await db.Farmer.update({ active: true }, { where: {} });
      console.log(chalk.bold.green("All farmers have been activated!"));
    });
};
