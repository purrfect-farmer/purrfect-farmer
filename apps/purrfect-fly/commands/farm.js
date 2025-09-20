/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("farm <farmer>")
    .option("-u, --user <user>", "Specify user by ID")
    .description("Run a farmer")
    .usage("farm example")
    .action(async (farmer, options) => {
      const farmers = await import("../farmers/index.js").then(
        (m) => m.default
      );

      const FarmerClass = farmers[farmer];

      if (!FarmerClass) {
        console.warn(`No farmer class found for "${farmer}"`);
        return;
      }

      const user = options.user;

      FarmerClass.run({ user });
    });
};
