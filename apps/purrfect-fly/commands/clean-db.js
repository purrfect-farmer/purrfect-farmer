/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("clean-db")
    .description("Clean the database")
    .action(async () => {
      console.log(chalk.blue("Cleaning database..."));
      await import("../actions/clean-database.js").then((m) => m.default());
      console.log(chalk.green("Database cleaned successfully!"));
    });
};
