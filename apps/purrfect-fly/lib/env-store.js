import { createEnvStore } from "./env/store.js";
import path from "node:path";
import { getCurrentPath } from "./path.js";

const { __dirname } = getCurrentPath(import.meta.url);

export default createEnvStore(path.resolve(__dirname, "../"));
