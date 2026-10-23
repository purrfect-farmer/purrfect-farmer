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
      const { activateUnfrozenFarmers } =
        await import("../services/farmer-activation.js");

      await activateUnfrozenFarmers();
      console.log(chalk.bold.green("All farmers have been activated!"));
    });
};
