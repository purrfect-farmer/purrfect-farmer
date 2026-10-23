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
const farmerClasses = fs
  .readdirSync(farmersDir)
  .filter((file) => file.endsWith(".js"));

for (const file of farmerClasses) {
  const FarmerClass = await import(path.join(farmersDir, file)).then(
    (m) => m.default,
  );

  if (FarmerClass.published || ENABLE_UNPUBLISHED_FARMERS) {
    farmers[FarmerClass.id] = createRunner(FarmerClass);
  }
}

export default farmers;
