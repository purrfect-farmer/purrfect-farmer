const path = require("path");
const { Keyv } = require("keyv");
const { KeyvSqlite } = require("@keyv/sqlite");

const keyvSqlite = new KeyvSqlite(
  "sqlite://" + path.resolve(__dirname, "../db/cache.sqlite")
);
const cache = new Keyv({ store: keyvSqlite, namespace: "cache" });

module.exports = cache;
