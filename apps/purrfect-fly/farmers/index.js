import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import createRunner from "./Runner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

  if (FarmerClass.published) {
    farmers[FarmerClass.id] = createRunner(FarmerClass);
  }
}

export default farmers;
