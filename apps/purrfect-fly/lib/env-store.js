import { createEnvStore } from "./env-file.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default createEnvStore(path.resolve(__dirname, "../"));
