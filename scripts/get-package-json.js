import fs from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get package.json
 */
export async function getPackageJson() {
  return JSON.parse(
    await fs.readFile(path.join(__dirname, "../package.json"), "utf8")
  );
}
