import fs from "node:fs";
import path from "node:path";

import createRunner from "./Runner.js";
import { getCurrentPath } from "../lib/path.js";

const ENABLE_UNPUBLISHED_FARMERS = env("ENABLE_UNPUBLISHED_FARMERS", false);

const { __dirname } = getCurrentPath(import.meta.url);
const farmers = {};

const farmersDir = path.join(
  __dirname,
  "../node_modules/@purrfect/shared/farmers",
);
/** Each farmer lives in its own folder, entered through index.js */
const farmerEntries = fs
  .readdirSync(farmersDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(farmersDir, entry.name, "index.js"))
  .filter((file) => fs.existsSync(file));

for (const file of farmerEntries) {
  const FarmerClass = await import(file).then((m) => m.default);

  if (FarmerClass.published || ENABLE_UNPUBLISHED_FARMERS) {
    farmers[FarmerClass.id] = createRunner(FarmerClass);
  }
}

export default farmers;
