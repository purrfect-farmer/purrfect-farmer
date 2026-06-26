import { fileURLToPath } from "node:url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("execute <farmer>")
    .description("Execute a farmer")
    .usage("execute example")
    .action(async (farmer, options) => {
      /** Import callback */
      const callback = await import(`../farmers/${farmer}/index.js`).then(
        (m) => m.default,
      );

      /** Change working directory */
      process.chdir(path.resolve(__dirname, `../farmers/${farmer}`));

      /** Execute callback */
      callback();
    });
};
