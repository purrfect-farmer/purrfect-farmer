const app = require("../config/app");
const farmers = require("../farmers");

/**
 *
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 */
module.exports = (program, inquirer) => {
  program
    .command("farm <farmer>")
    .description("Run a farmer")
    .usage("farm example")
    .action(async (farmer) => {
      const config = app.drops.find((item) => item.id === farmer);
      const FarmerClass = farmers[farmer];

      if (!FarmerClass) {
        console.warn(`No farmer class found for "${farmer}"`);
        return;
      }

      FarmerClass.run(config);
    });
};
