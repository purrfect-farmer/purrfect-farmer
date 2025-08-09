import path from "path";
import { Keyv } from "keyv";
import { KeyvSqlite } from "@keyv/sqlite";

import { getCurrentPath } from "../lib/path.js";

const { __dirname } = getCurrentPath(import.meta.url);

const keyvSqlite = new KeyvSqlite(
  "sqlite://" + path.resolve(__dirname, "../db/cache.sqlite")
);
const cache = new Keyv({ store: keyvSqlite, namespace: "cache" });

export default cache;
