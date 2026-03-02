"use strict";

import "../../config/env.js";

import Sequelize from "sequelize";
import databaseConfig from "../../config/database.js";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import process from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.NODE_ENV || "development";
const basename = path.basename(__filename);
const config = databaseConfig[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config,
  );
}

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
