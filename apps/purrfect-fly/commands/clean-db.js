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
      const farmers = await import("../farmers/index.js").then(
        (m) => m.default
      );

      const db = await import("../db/models/index.js").then((m) => m.default);
      const farmerIds = Object.keys(farmers);

      console.log(chalk.blue("Cleaning database..."));
      console.log("Farmer IDs:", farmerIds);
      await db.Farmer.destroy({
        where: {
          farmer: { [db.Sequelize.Op.notIn]: farmerIds },
        },
      });
      console.log(chalk.green("Database cleaned successfully!"));
    });
};
