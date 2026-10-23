import "../../config/env.js";

import Sequelize from "sequelize";
import databaseConfig from "../../config/database.js";
import fs from "node:fs";
import path from "node:path";
import { getCurrentPath } from "../../lib/path.js";

const { __dirname, __filename } = getCurrentPath(import.meta.url);

const env = process.env.NODE_ENV || "development";
const basename = path.basename(__filename);
const config = databaseConfig[env];
const db = {};

/**
 * @type {import("sequelize").Sequelize}
 */
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config,
);

const models = fs.readdirSync(__dirname).filter((file) => {
  return (
    file.indexOf(".") !== 0 &&
    file !== basename &&
    file.slice(-3) === ".js" &&
    file.indexOf(".test.js") === -1
  );
});

for (const file of models) {
  const model = await import(path.join(__dirname, file)).then((m) =>
    m.default(sequelize, Sequelize.DataTypes),
  );

  db[model.name] = model;
}

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
