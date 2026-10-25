import "../lib/env/external.js";
import dotenv from "dotenv";
import { ensureGeneratedKeys } from "../lib/env/generated-keys.js";
import path from "node:path";
import { getCurrentPath } from "../lib/path.js";
import { readEnvValue } from "../lib/env/value.js";

const { __dirname } = getCurrentPath(import.meta.url);
const envPath = path.resolve(__dirname, "../.env");

/** Fill in the keys the server makes itself before anything reads them */
for (const key of ensureGeneratedKeys(envPath)) {
  console.log(`Generated ${key} in .env`);
}

dotenv.config({ path: envPath });

global.env = readEnvValue;
