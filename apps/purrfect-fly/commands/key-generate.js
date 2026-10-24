import {
  GENERATED_ENV_KEYS,
  ensureGeneratedKeys,
  writtenKeys,
} from "../lib/env/generated-keys.js";

import app from "../config/app.js";

/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("key:generate")
    .description("Generate the server keys missing from .env")
    .action(async () => {
      /** Loading the CLI usually filled them in already */
      ensureGeneratedKeys(app.envPath);

      for (const key of GENERATED_ENV_KEYS) {
        const status = writtenKeys.has(key)
          ? chalk.green("generated")
          : chalk.blue("already set");

        console.log(`${chalk.bold(key)}: ${status}`);
      }
    });
};
