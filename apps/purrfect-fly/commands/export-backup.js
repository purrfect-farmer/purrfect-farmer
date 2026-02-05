import fs from "node:fs";
import { getCurrentPath } from "../lib/path.js";
import path from "node:path";

const { __dirname, __filename } = getCurrentPath(import.meta.url);

/**
 * @param {import("commander").Command} program
 * @param {typeof import("inquirer").default} inquirer
 * @param {typeof import("chalk").default} chalk
 */
export default (program, inquirer, chalk) => {
  program
    .command("export-backup")
    .description("Export Backup")
    .action(async () => {
      const { exportBackup } = await import("../lib/backup.js");
      const { filename, data } = await exportBackup();

      fs.writeFileSync(
        path.join(__dirname, "../backups", filename),
        JSON.stringify(data, null, 2),
      );

      console.log(chalk.bold.green(`Exported successfully: ${filename}`));
    });
};
